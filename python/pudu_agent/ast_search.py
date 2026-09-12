from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path
from typing import Any


def _which() -> str | None:
    return shutil.which("ast-grep") or shutil.which("sg")


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


def tool_info() -> dict[str, Any]:
    path = _which()
    return {
        "available": path is not None,
        "path": path,
        "version": _version(path) if path else None,
    }


def _match_from_ast(obj: dict[str, Any]) -> dict[str, Any] | None:
    if not isinstance(obj, dict):
        return None
    file_path = obj.get("file")
    text = obj.get("text")
    if not isinstance(file_path, str):
        return None
    if not isinstance(text, str):
        text = obj.get("lines") if isinstance(obj.get("lines"), str) else ""
    rng = obj.get("range") or {}
    start = rng.get("start") or {}
    end = rng.get("end") or {}
    start_line = start.get("line")
    start_col = start.get("column")
    end_line = end.get("line")
    end_col = end.get("column")
    metavars: dict[str, str] = {}
    meta = obj.get("metaVariables") or {}
    single = meta.get("single") if isinstance(meta, dict) else {}
    if isinstance(single, dict):
        for key, value in single.items():
            if isinstance(value, dict) and isinstance(value.get("text"), str):
                metavars[str(key)] = value["text"]
    language = obj.get("language")
    return {
        "file": file_path,
        "line": start_line + 1 if isinstance(start_line, int) else None,
        "column": start_col + 1 if isinstance(start_col, int) else None,
        "endLine": end_line + 1 if isinstance(end_line, int) else None,
        "endColumn": end_col + 1 if isinstance(end_col, int) else None,
        "text": text.rstrip("\n") if isinstance(text, str) else "",
        "strategy": "ast-grep",
        "language": language if isinstance(language, str) else None,
        "metavariables": metavars,
    }


def parse_ast_grep_stdout(stdout: str) -> list[dict[str, Any]]:
    text = (stdout or "").strip()
    if not text:
        return []
    matches: list[dict[str, Any]] = []
    try:
        parsed = json.loads(text)
        if isinstance(parsed, list):
            for item in parsed:
                match = _match_from_ast(item) if isinstance(item, dict) else None
                if match:
                    matches.append(match)
            return matches
        if isinstance(parsed, dict):
            match = _match_from_ast(parsed)
            return [match] if match else []
    except ValueError:
        pass
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
        except ValueError:
            continue
        match = _match_from_ast(obj) if isinstance(obj, dict) else None
        if match:
            matches.append(match)
    return matches


def run_ast_grep(
    repo: Path,
    pattern: str,
    globs: list[str],
    limit: int,
    timeout_s: float,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    binary = _which()
    if not binary:
        return [], [{"tool": "ast-grep", "message": "ast-grep not found on PATH", "origin": "MEASURED"}]
    args = [binary, "run", "-p", pattern, "--json=stream", str(repo)]
    for glob in globs:
        args.extend(["--globs", glob])
    try:
        proc = subprocess.run(
            args,
            capture_output=True,
            text=True,
            timeout=timeout_s,
            check=False,
        )
    except subprocess.TimeoutExpired:
        return [], [{"tool": "ast-grep", "message": "ast-grep timed out", "origin": "MEASURED"}]
    except OSError as exc:
        return [], [{"tool": "ast-grep", "message": str(exc), "origin": "MEASURED"}]

    stdout = proc.stdout or ""
    if proc.returncode not in (0, 1) and not stdout.strip():
        retry = [binary, "run", "-p", pattern, "--json", str(repo)]
        try:
            proc = subprocess.run(
                retry,
                capture_output=True,
                text=True,
                timeout=timeout_s,
                check=False,
            )
            stdout = proc.stdout or ""
        except (OSError, subprocess.TimeoutExpired) as exc:
            return [], [{"tool": "ast-grep", "message": str(exc), "origin": "MEASURED"}]

    matches = parse_ast_grep_stdout(stdout)[:limit]
    errors: list[dict[str, Any]] = []
    if proc.returncode not in (0, 1) and not matches:
        err = (proc.stderr or "").strip() or f"ast-grep exit {proc.returncode}"
        errors.append({"tool": "ast-grep", "message": err, "origin": "MEASURED"})
    return matches, errors
