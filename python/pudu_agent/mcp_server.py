from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

from pudu_agent.graph import build_graph
from pudu_agent.search import handle_search

PROTOCOL = "2024-11-05"


def _read() -> dict[str, Any] | None:
    headers: dict[str, str] = {}
    while True:
        line = sys.stdin.buffer.readline()
        if not line:
            return None
        if line in (b"\r\n", b"\n"):
            break
        decoded = line.decode("utf-8", errors="replace")
        if ":" not in decoded:
            continue
        key, value = decoded.split(":", 1)
        headers[key.strip().lower()] = value.strip()
    length = int(headers.get("content-length") or "0")
    if length <= 0:
        return None
    body = sys.stdin.buffer.read(length)
    return json.loads(body.decode("utf-8"))


def _write(payload: dict[str, Any]) -> None:
    raw = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    sys.stdout.buffer.write(f"Content-Length: {len(raw)}\r\n\r\n".encode("ascii"))
    sys.stdout.buffer.write(raw)
    sys.stdout.buffer.flush()


def _result(req_id: Any, result: Any) -> dict[str, Any]:
    return {"jsonrpc": "2.0", "id": req_id, "result": result}


def _error(req_id: Any, message: str) -> dict[str, Any]:
    return {"jsonrpc": "2.0", "id": req_id, "error": {"code": -32000, "message": message}}


def _tools() -> list[dict[str, Any]]:
    return [
        {
            "name": "pudu_repo_search",
            "description": "Deterministic repo search via rg/ast-grep/graph. No LLM. Never invents hits.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "repo": {"type": "string"},
                    "query": {"type": "string"},
                    "intent": {"type": "string"},
                    "limit": {"type": "integer"},
                },
            },
        },
        {
            "name": "pudu_repo_graph",
            "description": "Build a Python AST implementation graph. Edges are EXTRACTED or RESOLVED.",
            "inputSchema": {
                "type": "object",
                "properties": {"repo": {"type": "string"}},
            },
        },
    ]


def _call(name: str, args: dict[str, Any]) -> str:
    repo = args.get("repo") or "."
    if name == "pudu_repo_search":
        result = handle_search(
            {
                "op": "search",
                "repo": repo,
                "query": args.get("query"),
                "intent": args.get("intent"),
                "limit": args.get("limit") or 50,
            }
        )
        return json.dumps(result, ensure_ascii=False)
    if name == "pudu_repo_graph":
        graph = build_graph(Path(str(repo)).expanduser().resolve(), persist=True)
        slim = {
            "ok": graph.get("ok"),
            "repo": graph.get("repo"),
            "backend": graph.get("backend"),
            "metrics": graph.get("metrics"),
            "effort": graph.get("effort"),
            "writtenTo": graph.get("writtenTo"),
            "nodeCount": len(graph.get("nodes") or []),
            "edgeCount": len(graph.get("edges") or []),
        }
        return json.dumps(slim, ensure_ascii=False)
    raise ValueError(f"unknown tool: {name}")


def main() -> int:
    while True:
        req = _read()
        if req is None:
            return 0
        method = req.get("method")
        req_id = req.get("id")
        if method == "initialize":
            _write(
                _result(
                    req_id,
                    {
                        "protocolVersion": PROTOCOL,
                        "capabilities": {"tools": {}},
                        "serverInfo": {"name": "pudu-ai", "version": "0.2.23"},
                    },
                )
            )
            continue
        if method == "notifications/initialized" or method == "initialized":
            continue
        if method == "tools/list":
            _write(_result(req_id, {"tools": _tools()}))
            continue
        if method == "tools/call":
            params = req.get("params") or {}
            name = params.get("name")
            arguments = params.get("arguments") or {}
            try:
                text = _call(str(name), arguments if isinstance(arguments, dict) else {})
                _write(_result(req_id, {"content": [{"type": "text", "text": text}]}))
            except Exception as exc:
                _write(_error(req_id, str(exc)))
            continue
        if req_id is not None:
            _write(_error(req_id, f"unknown method: {method}"))
    return 0
