"""Bounded loopback-only HTTP orchestration for the PyCon Transformers demo."""

import argparse
from collections import deque
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from itertools import islice
import json
import math
import os
from pathlib import Path
import re
import stat
import threading
import uuid

from pudu_agent.model_client import ModelInfo, OllamaClient, validate_endpoint
from pudu_agent.transformers_ollama_demo import (
    DEFAULT_OLLAMA_URL,
    FIXTURE,
    FIXTURE_ROOT,
    PROJECT_ROOT,
    run_demo,
)


MAX_BODY_BYTES = 4096
MAX_EVENTS = 100
MAX_EVENT_TEXT = 240
MAX_RESULT_BYTES = 16 * 1024
MAX_ERROR_TEXT = 400
MAX_RUNS = 8
RUN_ID_RE = re.compile(r"^[0-9a-f]{32}$")
MANIFEST_ID_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")
MAX_MANIFEST_BYTES = 64 * 1024
MAX_ASSET_BYTES = 64 * 1024 * 1024
MAX_PROJECTED_NODES = 128
MAX_PROJECTED_TEXT = 4096
SENSITIVE_KEY_RE = re.compile(
    r"(?i)(?:api[_-]?key|private[_-]?key|access[_-]?key|secret|token|password|credential|authorization)"
)
SENSITIVE_PAIR_RE = re.compile(
    r"(?i)\b([\w.-]*(?:api[_-]?key|private[_-]?key|access[_-]?key|secret|token|password|credential|authorization)[\w.-]*)(\s*[:=]\s*)(?:bearer\s+)?(?:\"[^\"]*\"|'[^']*'|[^\s,;]+)"
)
POSIX_PATH_RE = re.compile(r"(?<![\w.])/(?:[^/\s<>,;:'\"]+/)*[^/\s<>,;:'\"]*")
WINDOWS_PATH_RE = re.compile(
    r"(?i)(?<![A-Za-z0-9])(?:[A-Z]:[\\/]|\\\\[^\\/\s]+[\\/][^\\/\s]+[\\/])(?:[^\\/\s<>\"']+[\\/])*[^\\/\s<>\"']*"
)
PRESENTATION_ASSETS = {
    "report.json": ("docs/demos/pycon-2026/evidence/report.json", "application/json", 512 * 1024),
    "report.md": ("docs/demos/pycon-2026/evidence/report.md", "text/markdown; charset=utf-8", 512 * 1024),
    "runbook.es.md": ("docs/demos/pycon-2026/DEMO_RUNBOOK.es.md", "text/markdown; charset=utf-8", 512 * 1024),
    "captions.es.vtt": ("docs/demos/pycon-2026/transformers-demo.captions.es.vtt", "text/vtt; charset=utf-8", 256 * 1024),
    "video.mp4": ("docs/demos/pycon-2026/pycon-2026-transformers-demo.mp4", "video/mp4", MAX_ASSET_BYTES),
}


def _bounded_text(value, limit):
    text = "".join(character for character in str(value)[:8192] if character >= " " and character != "\x7f")
    text = SENSITIVE_PAIR_RE.sub(r"\1\2[REDACTED]", text)
    text = re.sub(r"(?i)\bBearer\s+[^\s,;]+", "Bearer [REDACTED]", text)
    text = POSIX_PATH_RE.sub("[local path]", text)
    text = WINDOWS_PATH_RE.sub("[local path]", text)
    text = re.sub(r"(?i)file://[^\s]+|https?://[^\s]+", "[URL]", text)
    return text[:limit]


def _safe_relative_reference(value):
    if not isinstance(value, str) or not value or len(value.encode("utf-8")) > 240:
        return False
    if value.startswith(("/", "\\")) or "\\" in value or re.match(r"(?i)^[a-z]:", value):
        return False
    if value.endswith("/") or any(part in {"", ".", ".."} for part in value.split("/")[:-1]):
        return False
    return not any(ord(character) < 32 for character in value) and not re.match(r"(?i)^https?://", value)


def _project_untrusted(value):
    state = {"nodes": MAX_PROJECTED_NODES, "text": MAX_PROJECTED_TEXT}

    def project(item, depth=0):
        if state["nodes"] <= 0 or depth > 8:
            return "[TRUNCATED]"
        state["nodes"] -= 1
        if isinstance(item, str):
            safe = _bounded_text(item, min(2048, state["text"]))
            encoded = safe.encode("utf-8")
            if len(encoded) > state["text"]:
                safe = encoded[:state["text"]].decode("utf-8", "ignore")
                encoded = safe.encode("utf-8")
            state["text"] -= len(encoded)
            return safe
        if isinstance(item, dict):
            output = {}
            for key, child in islice(item.items(), 48):
                if not isinstance(key, str):
                    continue
                safe_key = _bounded_text(key, 64)
                if not safe_key or safe_key in output:
                    continue
                if safe_key == "evidence_refs" and isinstance(child, list):
                    output[safe_key] = [project(ref, depth + 1) for ref in child[:8] if _safe_relative_reference(ref)]
                elif SENSITIVE_KEY_RE.search(safe_key):
                    output[safe_key] = "[REDACTED]"
                else:
                    output[safe_key] = project(child, depth + 1)
            return output
        if isinstance(item, (list, tuple)):
            return [project(child, depth + 1) for child in item[:48]]
        if item is None or isinstance(item, (bool, int)):
            return item
        if isinstance(item, float) and math.isfinite(item):
            return item
        return None

    projected = project(value)
    encoded = json.dumps(projected, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    if len(encoded) > MAX_RESULT_BYTES:
        return {"error": "result exceeded projection limit"}
    return projected


def _read_confined_file(root, relative_path, max_bytes):
    if not hasattr(os, "O_NOFOLLOW") or not hasattr(os, "O_DIRECTORY"):
        raise OSError("platform cannot safely enforce file confinement")
    parts = Path(relative_path).parts
    if not parts or any(part in {"", ".", ".."} for part in parts):
        raise ValueError("invalid fixed relative path")
    directory_flags = os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW
    root_fd = os.open(root, directory_flags)
    current_fd = root_fd
    try:
        for component in parts[:-1]:
            child_fd = os.open(component, directory_flags, dir_fd=current_fd)
            if current_fd != root_fd:
                os.close(current_fd)
            current_fd = child_fd
        file_fd = os.open(parts[-1], os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=current_fd)
        try:
            info = os.fstat(file_fd)
            if not stat.S_ISREG(info.st_mode) or info.st_size > max_bytes:
                raise ValueError("file is not regular or exceeds its size limit")
            content = os.read(file_fd, max_bytes + 1)
            if len(content) > max_bytes:
                raise ValueError("file exceeds its size limit")
            return content
        finally:
            os.close(file_fd)
    finally:
        if current_fd != root_fd:
            os.close(current_fd)
        os.close(root_fd)


def _manifest_payload(root, manifest_id):
    if not MANIFEST_ID_RE.fullmatch(manifest_id):
        return None
    try:
        if str(uuid.UUID(manifest_id)) != manifest_id:
            return None
    except ValueError:
        return None
    try:
        raw = _read_confined_file(root, f".pudu-ai/pycon-demo/{manifest_id}.json", MAX_MANIFEST_BYTES)
        parsed = json.loads(raw.decode("utf-8"))
    except FileNotFoundError:
        return None
    if not isinstance(parsed, dict):
        raise ValueError("manifest must be a JSON object")
    return _project_untrusted(parsed)


def _model_records(models):
    records = []
    for model in models:
        if isinstance(model, ModelInfo) and model.tag and model.digest:
            records.append({"tag": _bounded_text(model.tag, 128), "digest": _bounded_text(model.digest, 160)})
    return sorted(records, key=lambda record: record["tag"])


class DemoService:
    """Coordinates one analysis run; all external behavior is injectable for tests."""

    def __init__(self, *, client_factory=OllamaClient, runner=run_demo, endpoint=DEFAULT_OLLAMA_URL,
                 fixture_exists=lambda: FIXTURE_ROOT.is_dir(), project_root=PROJECT_ROOT):
        self.endpoint = validate_endpoint(endpoint)
        self.client_factory = client_factory
        self.runner = runner
        self.fixture_exists = fixture_exists
        self.project_root = Path(project_root)
        self.lock = threading.RLock()
        self.runs = {}
        self.active_run = None

    def models(self):
        client = self.client_factory(self.endpoint, timeout=10)
        return _model_records(client.list_model_details())

    def preflight(self):
        try:
            models = self.models()
            available = bool(self.fixture_exists())
            return {"ready": available and bool(models), "fixture_available": available,
                    "fixture": dict(FIXTURE), "ollama_endpoint": self.endpoint,
                    "models_available": bool(models)}
        except Exception as error:
            return {"ready": False, "fixture_available": bool(self.fixture_exists()),
                    "fixture": dict(FIXTURE), "ollama_endpoint": self.endpoint,
                    "models_available": False, "error": "Preflight unavailable."}

    def start(self, tag, digest):
        if not isinstance(tag, str) or not isinstance(digest, str) or not tag or not digest:
            raise ValueError("an exact installed model tag and digest are required")
        with self.lock:
            if self.active_run is not None:
                raise RuntimeError("another analysis run is active")
            available = self.models()
            if {"tag": tag, "digest": digest} not in available:
                raise ValueError("selected model identity is not currently installed")
            run_id = uuid.uuid4().hex
            record = {"run_id": run_id, "status": "queued", "events": deque(maxlen=MAX_EVENTS),
                      "result": None, "error": None, "manifest_id": None,
                      "created_at": datetime.now(timezone.utc).isoformat()}
            self.runs[run_id] = record
            while len(self.runs) > MAX_RUNS:
                oldest = next(iter(self.runs))
                if oldest == self.active_run:
                    break
                del self.runs[oldest]
            self.active_run = run_id
            self._event(record, "queued", "Run accepted")
        thread = threading.Thread(target=self._execute, args=(record, tag, digest), daemon=True)
        thread.start()
        return {"run_id": run_id, "status": "queued"}

    def _event(self, record, stage, message):
        record["events"].append({"stage": _bounded_text(stage, 48), "message": _bounded_text(message, MAX_EVENT_TEXT),
                                 "timestamp": datetime.now(timezone.utc).isoformat()})

    def _execute(self, record, tag, digest):
        with self.lock:
            record["status"] = "running"
            self._event(record, "running", "Analysis started")

        def progress(stage, message):
            with self.lock:
                self._event(record, stage, message)

        try:
            from types import SimpleNamespace
            args = SimpleNamespace(repository=FIXTURE_ROOT, ollama_url=self.endpoint,
                                   ollama_timeout_seconds=120, model=tag, interactive=False)
            response, manifest_path = self.runner(args, progress_callback=progress, expected_model_digest=digest)
            safe_response = _project_untrusted(response)
            manifest_name = Path(manifest_path).name
            manifest_id = manifest_name[:-5] if manifest_name.endswith(".json") else ""
            if not MANIFEST_ID_RE.fullmatch(manifest_id):
                manifest_id = None
            with self.lock:
                record["result"] = safe_response
                record["manifest_id"] = manifest_id
                record["status"] = "completed"
                self._event(record, "completed", "Analysis completed; factual correctness is unverified")
        except Exception:
            message = "Analysis failed."
            with self.lock:
                record["status"] = "failed"
                record["error"] = message
                self._event(record, "failed", message)
        finally:
            with self.lock:
                if self.active_run == record["run_id"]:
                    self.active_run = None

    def get_run(self, run_id):
        if not RUN_ID_RE.fullmatch(run_id):
            return None
        with self.lock:
            record = self.runs.get(run_id)
            if record is None:
                return None
            return {key: record[key] for key in ("run_id", "status", "result", "error", "manifest_id", "created_at")}

    def get_events(self, run_id):
        if not RUN_ID_RE.fullmatch(run_id):
            return None
        with self.lock:
            record = self.runs.get(run_id)
            return None if record is None else list(record["events"])


def create_server(service=None, host="127.0.0.1", port=0):
    if host != "127.0.0.1":
        raise ValueError("web server must bind the literal IPv4 loopback address 127.0.0.1")
    service = service or DemoService()

    class Handler(BaseHTTPRequestHandler):
        server_version = "PuduPyCon/1"
        sys_version = ""

        def log_message(self, format, *args):
            return

        def _json(self, status, value):
            raw = json.dumps(value, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
            self._bytes(status, raw, "application/json; charset=utf-8")

        def _bytes(self, status, raw, content_type):
            self.send_response(status)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(raw)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.end_headers()
            self.wfile.write(raw)

        def _same_origin_mutation(self):
            expected_host = f"127.0.0.1:{self.server.server_port}"
            if self.headers.get("Host", "").lower() != expected_host:
                self._json(403, {"error": "invalid host"})
                return False
            origin = self.headers.get("Origin")
            if origin and origin.lower() != "http://" + expected_host:
                self._json(403, {"error": "invalid origin"})
                return False
            return True

        def _body(self):
            raw_length = self.headers.get("Content-Length")
            if raw_length is None or not raw_length.isdecimal():
                raise ValueError("content length is required")
            length = int(raw_length)
            if length > MAX_BODY_BYTES:
                raise OverflowError("request body exceeds size limit")
            raw = self.rfile.read(length)
            value = json.loads(raw.decode("utf-8"))
            if not isinstance(value, dict):
                raise ValueError("request must be a JSON object")
            return value

        def do_GET(self):
            if self.path == "/api/preflight":
                self._json(200, service.preflight())
                return
            if self.path == "/api/models":
                try:
                    self._json(200, {"models": service.models()})
                except Exception:
                    self._json(503, {"error": "installed model inventory is unavailable"})
                return
            manifest_match = re.fullmatch(r"/api/manifests/([0-9a-f-]{36})", self.path)
            if manifest_match:
                try:
                    manifest = _manifest_payload(service.project_root, manifest_match.group(1))
                except (OSError, ValueError, UnicodeError, json.JSONDecodeError):
                    manifest = None
                if manifest is None:
                    self._json(404, {"error": "manifest not found"})
                else:
                    self._json(200, manifest)
                return
            asset_name = self.path.removeprefix("/api/presentation/")
            if self.path.startswith("/api/presentation/") and asset_name in PRESENTATION_ASSETS:
                relative_path, content_type, max_bytes = PRESENTATION_ASSETS[asset_name]
                try:
                    raw = _read_confined_file(service.project_root, relative_path, max_bytes)
                except (OSError, ValueError):
                    raw = None
                if raw is None:
                    self._json(404, {"error": "presentation asset not found"})
                else:
                    self._bytes(200, raw, content_type)
                return
            match = re.fullmatch(r"/api/runs/([0-9a-f]{32})(/events)?", self.path)
            if match:
                value = service.get_events(match.group(1)) if match.group(2) else service.get_run(match.group(1))
                if value is None:
                    self._json(404, {"error": "run not found"})
                else:
                    self._json(200, {"events": value} if match.group(2) else value)
                return
            self._json(404, {"error": "not found"})

        def do_POST(self):
            if self.path != "/api/runs":
                self._json(404, {"error": "not found"})
                return
            if not self._same_origin_mutation():
                return
            try:
                value = self._body()
                if set(value) != {"model", "digest"}:
                    raise ValueError("request must contain only model and digest")
                self._json(202, service.start(value["model"], value["digest"]))
            except OverflowError as error:
                self._json(413, {"error": str(error)})
            except json.JSONDecodeError:
                self._json(400, {"error": "request body must be valid JSON"})
            except (UnicodeError, ValueError) as error:
                self._json(400, {"error": _bounded_text(error, MAX_ERROR_TEXT)})
            except RuntimeError as error:
                self._json(409, {"error": _bounded_text(error, MAX_ERROR_TEXT)})
            except Exception:
                self._json(503, {"error": "model inventory is unavailable"})

    class LoopbackServer(ThreadingHTTPServer):
        daemon_threads = True
        allow_reuse_address = False

    return LoopbackServer((host, port), Handler)


def main(argv=None):
    parser = argparse.ArgumentParser(description="Serve the local PyCon Transformers demo API on loopback.")
    parser.add_argument("--host", default="127.0.0.1", help="literal loopback bind address (default: %(default)s)")
    parser.add_argument("--port", type=int, default=8765, help="local HTTP port (default: %(default)s)")
    args = parser.parse_args(argv)
    server = create_server(host=args.host, port=args.port)
    try:
        print(f"PyCon demo API listening at http://127.0.0.1:{server.server_port}")
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
