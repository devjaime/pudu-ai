"""Bounded, read-only repository context and Ollama execution."""

import os
import re
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from pudu_agent.model_client import GenerateResult, OllamaClient
from pudu_agent.task import Task


ALLOWED_EXTENSIONS = {".py", ".ts", ".tsx", ".js", ".jsx", ".md", ".json", ".toml", ".yaml", ".yml", ".go", ".rs", ".java", ".sql"}
SKIP_DIRS = {".git", "node_modules", ".venv", "venv", "__pycache__", ".pudu-ai", "dist", "build", "target", ".next"}
SENSITIVE_NAMES = {".env", ".env.local", "id_rsa", "id_ed25519", "credentials", "secrets.json", "secrets.yaml", "secrets.yml"}
MAX_SCAN_FILES = 2000
MAX_CONTEXT_FILES = 32
MAX_FILE_BYTES = 64_000
MAX_TOTAL_BYTES = 256_000
MAX_PROMPT_BYTES = 16_000
MAX_FINAL_PROMPT_BYTES = 64_000
MAX_TIMEOUT_S = 10.0


class ContextError(ValueError):
    pass


@dataclass(frozen=True)
class ContextResult:
    prompt: str
    files: list[str]
    bytes_read: int
    truncated: bool


def _is_sensitive(path: Path) -> bool:
    name = path.name.lower()
    return name in SENSITIVE_NAMES or name.startswith(".env.") or any(token in name for token in ("secret", "credential", "private_key"))


def _is_excluded(root: Path, path: Path) -> bool:
    try:
        parts = path.relative_to(root).parts
    except ValueError:
        return True
    return any(part in SKIP_DIRS or _is_sensitive(Path(part)) for part in parts)


def _inside(root: Path, path: Path) -> bool:
    try:
        path.relative_to(root)
        return True
    except ValueError:
        return False


def _discover(root: Path, deadline: float) -> tuple[list[Path], bool]:
    candidates = []
    visited = 0
    timed_out = False
    for directory, dirnames, filenames in os.walk(root, topdown=True, followlinks=False):
        if time.monotonic() >= deadline:
            timed_out = True
            break
        current = Path(directory)
        dirnames[:] = [name for name in dirnames if not _is_excluded(root, current / name) and not (current / name).is_symlink()]
        for name in filenames:
            if time.monotonic() >= deadline:
                timed_out = True
                break
            path = current / name
            visited += 1
            if visited > MAX_SCAN_FILES:
                return candidates, timed_out
            if path.is_symlink() or not path.is_file() or _is_excluded(root, path) or path.suffix.lower() not in ALLOWED_EXTENSIONS:
                continue
            candidates.append(path)
    return candidates, timed_out


def build_context(task: Task, repository: str | Path, *, candidate_paths: Iterable[str | Path] | None = None,
                  max_files: int = 8, per_file_bytes: int = 12_000, max_total_bytes: int = 48_000,
                  max_results: int = 8, max_prompt_bytes: int = 8_000, timeout_s: float = 2.0) -> ContextResult:
    """Build bounded context; deadlines are cooperative between filesystem operations.

    The downstream urllib timeout is a per-operation/socket timeout, not a guaranteed
    end-to-end wall-clock cancellation. An in-flight network operation cannot be
    cancelled synchronously without additional workers or transport support.
    """
    for name, value in (("max_files", max_files), ("per_file_bytes", per_file_bytes),
                        ("max_total_bytes", max_total_bytes), ("max_results", max_results),
                        ("max_prompt_bytes", max_prompt_bytes)):
        if not isinstance(value, int) or isinstance(value, bool) or value <= 0:
            raise ValueError(f"{name} must be a positive integer")
    if timeout_s <= 0:
        raise ValueError("timeout_s must be positive")
    if (max_files > MAX_CONTEXT_FILES or max_results > MAX_CONTEXT_FILES or per_file_bytes > MAX_FILE_BYTES or
            max_total_bytes > MAX_TOTAL_BYTES or max_prompt_bytes > MAX_PROMPT_BYTES or timeout_s > MAX_TIMEOUT_S):
        raise ValueError("requested context limits exceed hard safety caps")
    root = Path(repository).expanduser().resolve(strict=True)
    if not root.is_dir():
        raise ContextError("repository root is not a directory")
    deadline = time.monotonic() + timeout_s
    timed_out = False
    if candidate_paths is None:
        candidates, timed_out = _discover(root, deadline)
    else:
        candidates = []
        for value in candidate_paths:
            if time.monotonic() >= deadline:
                timed_out = True
                break
            if len(candidates) >= MAX_SCAN_FILES:
                break
            raw = Path(value)
            path = raw if raw.is_absolute() else root / raw
            lexical = Path(os.path.abspath(path))
            if not _inside(root, lexical):
                raise ContextError("context path escapes repository")
            current = root
            for part in lexical.relative_to(root).parts:
                current = current / part
                if current.is_symlink():
                    raise ContextError("symlink context paths are not allowed")
            resolved = path.resolve(strict=False)
            if not _inside(root, resolved):
                raise ContextError("context path escapes repository")
            if _is_excluded(root, resolved) or resolved.suffix.lower() not in ALLOWED_EXTENSIONS:
                continue
            candidates.append(resolved)

    prompt_bytes = task.prompt.encode("utf-8")
    prompt_was_cut = len(prompt_bytes) > max_prompt_bytes
    prompt_text = prompt_bytes[:max_prompt_bytes].decode("utf-8", errors="ignore") if prompt_was_cut else task.prompt
    words = set(re.findall(r"[a-zA-Z0-9_]{3,}", prompt_text.lower()))
    candidates = list(dict.fromkeys(candidates))
    candidates.sort(key=lambda path: (
        0 if path.name.lower().startswith("readme") else 1,
        -sum(1 for word in words if word in path.stem.lower()),
        str(path.relative_to(root)).lower(),
    ))
    max_count = min(max_files, max_results)
    selected = candidates[:max_count]
    excerpts: list[tuple[str, str]] = []
    bytes_read = 0
    truncated = timed_out or prompt_was_cut or len(candidates) > len(selected)
    for path in selected:
        if time.monotonic() >= deadline:
            truncated = True
            break
        if path.is_symlink():
            continue
        resolved = path.resolve(strict=True)
        if not _inside(root, resolved):
            raise ContextError("context path escapes repository")
        if not resolved.is_file():
            continue
        remaining = max_total_bytes - bytes_read
        if remaining <= 0:
            truncated = True
            break
        limit = min(per_file_bytes, remaining)
        try:
            with resolved.open("rb") as stream:
                raw = stream.read(limit + 1)
        except OSError:
            continue
        was_cut = len(raw) > limit
        raw = raw[:limit]
        bytes_read += len(raw)
        truncated = truncated or was_cut
        rel = str(resolved.relative_to(root)).replace("\\", "/")
        excerpts.append((rel, raw.decode("utf-8", errors="replace")))
    sections = [f"Task: {prompt_text}", "Read-only repository excerpts (bounded):"]
    for rel, excerpt in excerpts:
        sections.append(f"\n--- {rel} ---\n{excerpt}")
    sections.append("\nReturn text only. Do not propose executing generated commands or modifying files.")
    prompt = "\n".join(sections)
    encoded_prompt = prompt.encode("utf-8")
    if len(encoded_prompt) > MAX_FINAL_PROMPT_BYTES:
        prompt = encoded_prompt[:MAX_FINAL_PROMPT_BYTES].decode("utf-8", errors="ignore")
        truncated = True
    return ContextResult(prompt, [rel for rel, _ in excerpts], bytes_read, truncated)


def execute_local(client: OllamaClient, model: str, prompt: str) -> GenerateResult:
    """Call only the local inference client; generated output is never executed."""
    return client.generate(model, prompt)
