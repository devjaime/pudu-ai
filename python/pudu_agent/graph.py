from __future__ import annotations

import ast
import json
import time
from pathlib import Path
from typing import Any

SKIP_DIRS = {
    ".git",
    "node_modules",
    ".venv",
    "venv",
    "__pycache__",
    ".pudu-ai",
    "dist",
    "build",
    ".tox",
    ".mypy_cache",
}
MAX_FILES = 500
MAX_EDGES = 3000
MAX_BYTES = 400_000


def graph_tool_info() -> dict[str, Any]:
    return {"available": True, "path": "python-ast", "version": "stdlib"}


def _rel(repo: Path, path: Path) -> str:
    try:
        return str(path.relative_to(repo)).replace("\\", "/")
    except ValueError:
        return str(path)


def _iter_py_files(repo: Path) -> list[Path]:
    files: list[Path] = []
    for path in repo.rglob("*.py"):
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        if not path.is_file():
            continue
        files.append(path)
        if len(files) >= MAX_FILES:
            break
    return files


def _module_name(rel: str) -> str:
    body = rel[:-3] if rel.endswith(".py") else rel
    if body.endswith("/__init__"):
        body = body[: -len("/__init__")]
    return body.replace("/", ".")


def _is_test(rel: str) -> bool:
    name = Path(rel).name
    return name.startswith("test_") or name.endswith("_test.py") or "/tests/" in f"/{rel}/"


def _load_graphify(repo: Path) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    path = repo / "graphify-out" / "graph.json"
    if not path.is_file():
        return [], [], []
    try:
        raw = json.loads(path.read_text(encoding="utf8"))
    except (OSError, ValueError) as exc:
        return [], [], [{"tool": "graphify", "message": str(exc), "origin": "MEASURED"}]
    nodes_in = raw.get("nodes") if isinstance(raw, dict) else None
    edges_in = raw.get("edges") if isinstance(raw, dict) else None
    if not isinstance(nodes_in, list) or not isinstance(edges_in, list):
        return [], [], [{"tool": "graphify", "message": "graphify-out/graph.json missing nodes/edges arrays", "origin": "MEASURED"}]
    nodes: list[dict[str, Any]] = []
    for item in nodes_in:
        if not isinstance(item, dict):
            continue
        ident = item.get("id") or item.get("name")
        if not isinstance(ident, str):
            continue
        kind = item.get("type") or item.get("kind") or "file"
        nodes.append(
            {
                "id": ident,
                "type": kind if isinstance(kind, str) else "file",
                "name": item.get("name") if isinstance(item.get("name"), str) else ident,
                "file": item.get("file") if isinstance(item.get("file"), str) else None,
                "line": item.get("line") if isinstance(item.get("line"), int) else None,
                "backend": "graphify",
            }
        )
    edges: list[dict[str, Any]] = []
    allowed = {"imports", "calls", "inherits", "references", "definitions"}
    for item in edges_in:
        if not isinstance(item, dict):
            continue
        source = item.get("source") or item.get("from")
        target = item.get("target") or item.get("to")
        kind = item.get("type") or item.get("kind") or item.get("relation")
        if not isinstance(source, str) or not isinstance(target, str) or not isinstance(kind, str):
            continue
        if kind not in allowed:
            continue
        edges.append(
            {
                "source": source,
                "target": target,
                "type": kind,
                "confidence": "EXTRACTED",
                "file": item.get("file") if isinstance(item.get("file"), str) else None,
                "line": item.get("line") if isinstance(item.get("line"), int) else None,
                "symbol": item.get("symbol") if isinstance(item.get("symbol"), str) else None,
                "backend": "graphify",
            }
        )
    return nodes, edges, []


def build_python_graph(repo: Path) -> tuple[list[dict[str, Any]], list[dict[str, Any]], int, list[dict[str, Any]]]:
    nodes: list[dict[str, Any]] = []
    edges: list[dict[str, Any]] = []
    errors: list[dict[str, Any]] = []
    chars = 0
    seen_nodes: set[str] = set()

    def add_node(node: dict[str, Any]) -> None:
        ident = node["id"]
        if ident in seen_nodes:
            return
        seen_nodes.add(ident)
        nodes.append(node)

    for path in _iter_py_files(repo):
        rel = _rel(repo, path)
        try:
            source = path.read_text(encoding="utf8", errors="replace")
        except OSError as exc:
            errors.append({"tool": "python-ast", "message": f"{rel}: {exc}", "origin": "MEASURED"})
            continue
        if len(source) > MAX_BYTES:
            errors.append({"tool": "python-ast", "message": f"{rel}: skipped, file larger than {MAX_BYTES} bytes", "origin": "MEASURED"})
            continue
        chars += len(source)
        try:
            tree = ast.parse(source, filename=rel)
        except SyntaxError as exc:
            errors.append({"tool": "python-ast", "message": f"{rel}: {exc.msg}", "origin": "MEASURED"})
            continue

        file_id = f"file:{rel}"
        mod_id = f"module:{_module_name(rel)}"
        add_node({"id": file_id, "type": "test" if _is_test(rel) else "file", "name": rel, "file": rel, "line": 1, "backend": "python-ast"})
        add_node({"id": mod_id, "type": "module", "name": _module_name(rel), "file": rel, "line": 1, "backend": "python-ast"})
        edges.append(
            {
                "source": file_id,
                "target": mod_id,
                "type": "definitions",
                "confidence": "EXTRACTED",
                "file": rel,
                "line": 1,
                "symbol": _module_name(rel),
                "backend": "python-ast",
            }
        )

        defs: dict[str, str] = {}
        current_fn: str | None = None

        class Visitor(ast.NodeVisitor):
            def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
                nonlocal current_fn
                ident = f"def:{rel}:{node.name}"
                add_node({"id": ident, "type": "function", "name": node.name, "file": rel, "line": node.lineno, "backend": "python-ast"})
                defs[node.name] = ident
                edges.append(
                    {
                        "source": file_id,
                        "target": ident,
                        "type": "definitions",
                        "confidence": "EXTRACTED",
                        "file": rel,
                        "line": node.lineno,
                        "symbol": node.name,
                        "backend": "python-ast",
                    }
                )
                prev = current_fn
                current_fn = ident
                self.generic_visit(node)
                current_fn = prev

            def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef) -> None:
                self.visit_FunctionDef(node)  # type: ignore[arg-type]

            def visit_ClassDef(self, node: ast.ClassDef) -> None:
                ident = f"class:{rel}:{node.name}"
                add_node({"id": ident, "type": "class", "name": node.name, "file": rel, "line": node.lineno, "backend": "python-ast"})
                defs[node.name] = ident
                edges.append(
                    {
                        "source": file_id,
                        "target": ident,
                        "type": "definitions",
                        "confidence": "EXTRACTED",
                        "file": rel,
                        "line": node.lineno,
                        "symbol": node.name,
                        "backend": "python-ast",
                    }
                )
                for base in node.bases:
                    name = base.id if isinstance(base, ast.Name) else None
                    if not name:
                        continue
                    target = defs.get(name, f"name:{name}")
                    if target.startswith("name:"):
                        add_node({"id": target, "type": "name", "name": name, "file": None, "line": None, "backend": "python-ast"})
                    edges.append(
                        {
                            "source": ident,
                            "target": target,
                            "type": "inherits",
                            "confidence": "EXTRACTED" if target in defs.values() else "EXTRACTED",
                            "file": rel,
                            "line": node.lineno,
                            "symbol": name,
                            "backend": "python-ast",
                        }
                    )
                self.generic_visit(node)

            def visit_Import(self, node: ast.Import) -> None:
                for alias in node.names:
                    target = f"module:{alias.name}"
                    add_node({"id": target, "type": "module", "name": alias.name, "file": None, "line": None, "backend": "python-ast"})
                    edges.append(
                        {
                            "source": file_id,
                            "target": target,
                            "type": "imports",
                            "confidence": "EXTRACTED",
                            "file": rel,
                            "line": node.lineno,
                            "symbol": alias.name,
                            "backend": "python-ast",
                        }
                    )

            def visit_ImportFrom(self, node: ast.ImportFrom) -> None:
                if not node.module:
                    return
                target = f"module:{node.module}"
                add_node({"id": target, "type": "module", "name": node.module, "file": None, "line": None, "backend": "python-ast"})
                edges.append(
                    {
                        "source": file_id,
                        "target": target,
                        "type": "imports",
                        "confidence": "EXTRACTED",
                        "file": rel,
                        "line": node.lineno,
                        "symbol": node.module,
                        "backend": "python-ast",
                    }
                )

            def visit_Call(self, node: ast.Call) -> None:
                name: str | None = None
                if isinstance(node.func, ast.Name):
                    name = node.func.id
                elif isinstance(node.func, ast.Attribute):
                    name = node.func.attr
                if name and current_fn:
                    target = defs.get(name, f"name:{name}")
                    confidence = "RESOLVED" if name in defs else "EXTRACTED"
                    if target.startswith("name:"):
                        add_node({"id": target, "type": "name", "name": name, "file": None, "line": None, "backend": "python-ast"})
                    edges.append(
                        {
                            "source": current_fn,
                            "target": target,
                            "type": "calls",
                            "confidence": confidence,
                            "file": rel,
                            "line": getattr(node, "lineno", None),
                            "symbol": name,
                            "backend": "python-ast",
                        }
                    )
                self.generic_visit(node)

        Visitor().visit(tree)
        if len(edges) >= MAX_EDGES:
            errors.append({"tool": "python-ast", "message": f"edge cap {MAX_EDGES} reached", "origin": "MEASURED"})
            break

    return nodes, edges[:MAX_EDGES], chars, errors


def effort_from_counts(file_count: int, edge_count: int, token_estimate: int) -> dict[str, Any]:
    score = min(100, int(round(file_count * 1.2 + edge_count * 0.15 + token_estimate / 800)))
    if score < 20:
        label = "LOW"
    elif score < 45:
        label = "MEDIUM"
    elif score < 75:
        label = "HIGH"
    else:
        label = "VERY_HIGH"
    return {
        "label": label,
        "score0to100": score,
        "origin": "DERIVED",
        "humanBaselineMinutes": None,
        "agentRuntimeMinutes": None,
        "humanInterventionMinutes": None,
        "potentialTimeReductionPct": None,
    }


def build_graph(repo: Path, persist: bool = True) -> dict[str, Any]:
    started = time.perf_counter()
    py_nodes, py_edges, chars, errors = build_python_graph(repo)
    gy_nodes, gy_edges, gy_errors = _load_graphify(repo)
    errors.extend(gy_errors)
    nodes = py_nodes + gy_nodes
    edges = py_edges + gy_edges
    backend = "hybrid" if gy_nodes or gy_edges else "python-ast"
    token_estimate = max(0, chars // 4)
    file_count = sum(1 for n in py_nodes if n["type"] in {"file", "test"})
    duration_ms = int((time.perf_counter() - started) * 1000)
    payload = {
        "schemaVersion": 1,
        "ok": True,
        "op": "graph",
        "repo": str(repo),
        "backend": backend,
        "writtenTo": None,
        "nodes": nodes,
        "edges": edges,
        "metrics": {
            "fileCount": file_count,
            "nodeCount": len(nodes),
            "edgeCount": len(edges),
            "tokenEstimate": token_estimate,
            "tokenOrigin": "ESTIMATED",
            "durationMs": duration_ms,
            "origin": "MEASURED",
        },
        "effort": effort_from_counts(file_count, len(edges), token_estimate),
        "errors": errors,
        "tools": {"graph": graph_tool_info()},
    }
    if persist:
        out_dir = repo / ".pudu-ai"
        out_dir.mkdir(parents=True, exist_ok=True)
        out = out_dir / "code-graph.json"
        out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf8")
        payload["writtenTo"] = str(out)
    return payload


def query_graph(graph: dict[str, Any], query: str | None, limit: int) -> list[dict[str, Any]]:
    if not query:
        return []
    needle = query.strip()
    for prefix in ("who calls ", "callers of ", "impact of ", "dependencies of ", "imports of "):
        if needle.lower().startswith(prefix):
            needle = needle[len(prefix) :].strip()
            break
    needle = needle.split()[0] if needle.split() else needle
    if not needle:
        return []
    matches: list[dict[str, Any]] = []
    for edge in graph.get("edges") or []:
        if not isinstance(edge, dict):
            continue
        symbol = edge.get("symbol") if isinstance(edge.get("symbol"), str) else ""
        target = edge.get("target") if isinstance(edge.get("target"), str) else ""
        if needle not in symbol and needle not in target:
            continue
        matches.append(
            {
                "file": edge.get("file") or "",
                "line": edge.get("line") if isinstance(edge.get("line"), int) else None,
                "column": None,
                "endLine": edge.get("line") if isinstance(edge.get("line"), int) else None,
                "endColumn": None,
                "text": f"{edge.get('type')} {edge.get('source')} -> {edge.get('target')} [{edge.get('confidence')}]",
                "strategy": "graph",
                "language": "python",
                "metavariables": {"symbol": symbol or needle},
            }
        )
        if len(matches) >= limit:
            break
    return matches
