"""Bounded loopback-only HTTP orchestration for the PyCon Transformers demo."""

import argparse
from collections import deque
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import re
import threading
import uuid
from pathlib import Path

from pudu_agent.model_client import ModelInfo, OllamaClient, validate_endpoint
from pudu_agent.transformers_ollama_demo import (
    DEFAULT_OLLAMA_URL,
    FIXTURE,
    FIXTURE_ROOT,
    run_demo,
)


MAX_BODY_BYTES = 4096
MAX_EVENTS = 100
MAX_EVENT_TEXT = 240
MAX_RESULT_BYTES = 16 * 1024
MAX_ERROR_TEXT = 400
MAX_RUNS = 8
RUN_ID_RE = re.compile(r"^[0-9a-f]{32}$")


def _bounded_text(value, limit):
    text = "".join(character for character in str(value) if character >= " " and character != "\x7f")
    text = re.sub(r"(?:/Users|/Volumes|/private|/tmp)/[^\s:'\"]+", "[local path]", text)
    text = re.sub(r"https?://[^\s]+", "[local URL]", text)
    return text[:limit]


def _model_records(models):
    records = []
    for model in models:
        if isinstance(model, ModelInfo) and model.tag and model.digest:
            records.append({"tag": _bounded_text(model.tag, 128), "digest": _bounded_text(model.digest, 160)})
    return sorted(records, key=lambda record: record["tag"])


class DemoService:
    """Coordinates one analysis run; all external behavior is injectable for tests."""

    def __init__(self, *, client_factory=OllamaClient, runner=run_demo, endpoint=DEFAULT_OLLAMA_URL,
                 fixture_exists=lambda: FIXTURE_ROOT.is_dir()):
        self.endpoint = validate_endpoint(endpoint)
        self.client_factory = client_factory
        self.runner = runner
        self.fixture_exists = fixture_exists
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
                    "models_available": False, "error": _bounded_text(type(error).__name__ + ": preflight unavailable", MAX_ERROR_TEXT)}

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
                      "result": None, "error": None, "manifest": None,
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
            encoded = json.dumps(response, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
            if len(encoded) > MAX_RESULT_BYTES:
                raise ValueError("analysis result exceeded the web response size limit")
            safe_response = json.loads(encoded.decode("utf-8"))
            with self.lock:
                record["result"] = safe_response
                record["manifest"] = _bounded_text(Path(manifest_path).name, 120)
                record["status"] = "completed"
                self._event(record, "completed", "Analysis completed; factual correctness is unverified")
        except Exception as error:
            message = _bounded_text(type(error).__name__ + ": " + str(error), MAX_ERROR_TEXT)
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
            return {key: record[key] for key in ("run_id", "status", "result", "error", "manifest", "created_at")}

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
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
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
