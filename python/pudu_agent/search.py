from __future__ import annotations

import json
import shutil
import subprocess
import time
from pathlib import Path
from typing import Any

from pudu_agent.ast_search import run_ast_grep, tool_info as ast_tool_info
from pudu_agent.protocol import (
    PROTOCOL_VERSION,
    classify_intent,
    error_response,
    read_request,
    strategies_for,
    write_response,
)

RG_TIMEOUT_S = 20


def _which(name: str) -> str | None:
    return shutil.which(name)


def _version(binary: str) -> str | None:
    try:
        proc = subprocess.run(
            [binary, "--version"],
            capture_output=True,
            text=True,
            timeout=5,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired):
        return None
    line = (proc.stdout or proc.stderr or "").strip().splitlines()
    return line[0] if line else None


def rg_tool_info() -> dict[str, Any]:
    path = _which("rg")
    return {
        "available": path is not None,
        "path": path,
        "version": _version(path) if path else None,
    }


def graph_tool_info() -> dict[str, Any]:
    return {"available": False, "path": None, "version": None}


def parse_rg_json_line(line: str) -> dict[str, Any] | None:
    line = line.strip()
    if not line:
        return None
    try:
        msg = json.loads(line)
    except ValueError:
        return None
    if not isinstance(msg, dict) or msg.get("type") != "match":
        return None
    data = msg.get("data") or {}
    path_obj = data.get("path") or {}
    lines_obj = data.get("lines") or {}
    text = lines_obj.get("text")
    if not isinstance(text, str):
        text = ""
    sub = (data.get("submatches") or [{}])[0]
    start = sub.get("start") if isinstance(sub, dict) else None
    file_path = path_obj.get("text") if isinstance(path_obj, dict) else None
    line_no = data.get("line_number")
    return {
        "file": file_path if isinstance(file_path, str) else "",
        "line": line_no if isinstance(line_no, int) else None,
        "column": start + 1 if isinstance(start, int) else None,
        "endLine": line_no if isinstance(line_no, int) else None,
        "endColumn": None,
        "text": text.rstrip("\n"),
        "strategy": "rg",
        "language": None,
        "metavariables": {},
    }


def run_rg(
    repo: Path,
    query: str,
    globs: list[str],
    limit: int,
    timeout_s: float,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    binary = _which("rg")
    if not binary:
        return [], [{"tool": "rg", "message": "rg not found on PATH", "origin": "MEASURED"}]
    args = [
        binary,
        "--json",
        "--no-mmap",
        "-F",
        "--glob",
        "!**/.git/**",
        "--glob",
        "!**/node_modules/**",
        "--glob",
        "!**/.pudu-ai/**",
    ]
    for glob in globs:
        args.extend(["--glob", glob])
    args.extend(["--", query, str(repo)])
    try:
        proc = subprocess.run(
            args,
            capture_output=True,
            text=True,
            timeout=timeout_s,
            check=False,
        )
    except subprocess.TimeoutExpired:
        return [], [{"tool": "rg", "message": "rg timed out", "origin": "MEASURED"}]
    except OSError as exc:
        return [], [{"tool": "rg", "message": str(exc), "origin": "MEASURED"}]
    matches: list[dict[str, Any]] = []
    for line in (proc.stdout or "").splitlines():
        parsed = parse_rg_json_line(line)
        if parsed:
            matches.append(parsed)
            if len(matches) >= limit:
                break
    errors: list[dict[str, Any]] = []
    if proc.returncode not in (0, 1):
        err = (proc.stderr or "").strip() or f"rg exit {proc.returncode}"
        errors.append({"tool": "rg", "message": err, "origin": "MEASURED"})
    return matches, errors


def empty_search(
    repo: str,
    query: str | None,
    structural: str | None,
    intent: str,
    strategy: str,
    tools: dict[str, Any],
    errors: list[dict[str, Any]],
    unavailable: list[str],
    duration_ms: int,
    rg_queries: int = 0,
    ast_queries: int = 0,
) -> dict[str, Any]:
    return {
        "schemaVersion": PROTOCOL_VERSION,
        "ok": True,
        "op": "search",
        "repo": repo,
        "query": query,
        "structuralPattern": structural,
        "intent": intent,
        "strategy": strategy,
        "matches": [],
        "tools": tools,
        "errors": errors,
        "metrics": {
            "durationMs": duration_ms,
            "matchCount": 0,
            "rgQueries": rg_queries,
            "astQueries": ast_queries,
            "graphQueries": 0,
            "origin": "MEASURED",
        },
        "unavailable": unavailable,
    }


def handle_search(req: dict[str, Any]) -> dict[str, Any]:
    started = time.perf_counter()
    repo_raw = req.get("repo") or "."
    repo = Path(repo_raw).expanduser().resolve()
    query = req.get("query")
    if isinstance(query, str):
        query = query.strip() or None
    else:
        query = None
    structural = req.get("structuralPattern")
    if isinstance(structural, str):
        structural = structural.strip() or None
    else:
        structural = None
    globs = req.get("globs") or []
    if not isinstance(globs, list):
        globs = []
    globs = [g for g in globs if isinstance(g, str) and g]
    limit = req.get("limit")
    limit = int(limit) if isinstance(limit, int) and limit > 0 else 100
    timeout_ms = req.get("timeoutMs")
    timeout_s = max(1.0, (timeout_ms / 1000) if isinstance(timeout_ms, int) else RG_TIMEOUT_S)

    tools = {
        "rg": rg_tool_info(),
        "astGrep": ast_tool_info(),
        "graph": graph_tool_info(),
    }
    explicit = req.get("intent") if isinstance(req.get("intent"), str) else None
    intent = classify_intent(query, structural, explicit)
    planned = strategies_for(intent)
    strategy = "hybrid" if len(planned) > 1 else (planned[0] if planned else "hybrid")

    if not repo.is_dir():
        duration_ms = int((time.perf_counter() - started) * 1000)
        result = empty_search(
            str(repo),
            query,
            structural,
            intent,
            strategy,
            tools,
            [{"tool": "search", "message": "repo is not a directory", "origin": "MEASURED"}],
            [],
            duration_ms,
        )
        result["ok"] = False
        return result

    if intent in {"RELATIONSHIP", "IMPACT", "SEMANTIC"} or planned == ["graph"] or not planned:
        duration_ms = int((time.perf_counter() - started) * 1000)
        unavailable = ["graph"] if intent in {"RELATIONSHIP", "IMPACT"} else (["semantic"] if intent == "SEMANTIC" else planned)
        errors = [
            {
                "tool": "graph" if intent != "SEMANTIC" else "semantic",
                "message": "not implemented in Agent Lab iteration 1",
                "origin": "MEASURED",
            }
        ]
        return empty_search(
            str(repo),
            query,
            structural,
            intent,
            strategy if planned else "hybrid",
            tools,
            errors,
            unavailable,
            duration_ms,
        )

    matches: list[dict[str, Any]] = []
    errors: list[dict[str, Any]] = []
    unavailable: list[str] = []
    rg_queries = 0
    ast_queries = 0
    pattern_for_ast = structural or query

    if "rg" in planned:
        if not query:
            errors.append({"tool": "rg", "message": "query required for text search", "origin": "MEASURED"})
        elif not tools["rg"]["available"]:
            unavailable.append("rg")
            errors.append({"tool": "rg", "message": "rg not found on PATH", "origin": "MEASURED"})
        else:
            rg_queries = 1
            found, rg_errors = run_rg(repo, query, globs, limit, timeout_s)
            matches.extend(found)
            errors.extend(rg_errors)

    if "ast-grep" in planned:
        if not pattern_for_ast:
            errors.append({"tool": "ast-grep", "message": "pattern required for structural search", "origin": "MEASURED"})
        elif not tools["astGrep"]["available"]:
            unavailable.append("ast-grep")
            errors.append({"tool": "ast-grep", "message": "ast-grep not found on PATH", "origin": "MEASURED"})
        else:
            ast_queries = 1
            remaining = max(0, limit - len(matches))
            found, ast_errors = run_ast_grep(repo, pattern_for_ast, globs, remaining or limit, timeout_s)
            matches.extend(found)
            errors.extend(ast_errors)

    if strategy == "rg" and "rg" in unavailable:
        ok = False
    elif strategy == "ast-grep" and "ast-grep" in unavailable:
        ok = False
    else:
        ok = True

    duration_ms = int((time.perf_counter() - started) * 1000)
    return {
        "schemaVersion": PROTOCOL_VERSION,
        "ok": ok,
        "op": "search",
        "repo": str(repo),
        "query": query,
        "structuralPattern": structural,
        "intent": intent,
        "strategy": strategy,
        "matches": matches[:limit],
        "tools": tools,
        "errors": errors,
        "metrics": {
            "durationMs": duration_ms,
            "matchCount": min(len(matches), limit),
            "rgQueries": rg_queries,
            "astQueries": ast_queries,
            "graphQueries": 0,
            "origin": "MEASURED",
        },
        "unavailable": unavailable,
    }


def main() -> int:
    try:
        req = read_request()
    except ValueError as exc:
        write_response(error_response(str(exc)))
        return 1
    op = req.get("op") or "search"
    if op == "ping":
        write_response({"schemaVersion": PROTOCOL_VERSION, "ok": True, "op": "ping"})
        return 0
    if op == "classify":
        intent = classify_intent(req.get("query"), req.get("structuralPattern"), req.get("intent"))
        write_response(
            {
                "schemaVersion": PROTOCOL_VERSION,
                "ok": True,
                "op": "classify",
                "intent": intent,
                "strategies": strategies_for(intent),
            }
        )
        return 0
    if op != "search":
        write_response(error_response(f"unknown op: {op}"))
        return 1
    result = handle_search(req)
    write_response(result)
    return 0 if result.get("ok") else 1


if __name__ == "__main__":
    raise SystemExit(main())
