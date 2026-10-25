import json
import os
import threading
import tempfile
import time
import unittest
from pathlib import Path
import uuid
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from pudu_agent.model_client import ModelInfo
from pudu_agent.pycon_web import DemoService, create_server


class FakeClient:
    def __init__(self, models=None):
        self.models = models or [ModelInfo("qwen2.5:7b", "sha256:abc")]

    def list_model_details(self):
        return self.models


class WebApiTests(unittest.TestCase):
    def setUp(self):
        self.client = FakeClient()
        self.calls = []
        self.release_runner = threading.Event()
        self.block_runner = False
        self.runner_error = None
        self.manifest_id = str(uuid.uuid4())
        self.runner_response = {"schema": "pudu.transformers-ollama-analysis/v1", "summary": "bounded result",
                                "findings": []}

        def runner(args, *, progress_callback=None, expected_model_digest=None):
            self.calls.append((args.model, expected_model_digest))
            if self.block_runner:
                self.release_runner.wait(timeout=2)
            if self.runner_error:
                raise self.runner_error
            if progress_callback:
                progress_callback("evidence", "Evidence collected")
                progress_callback("generation", "Generation completed")
            return self.runner_response, f".pudu-ai/pycon-demo/{self.manifest_id}.json"

        self.root = tempfile.TemporaryDirectory()
        self.addCleanup(self.root.cleanup)
        self.project_root = Path(self.root.name)
        self._write_assets()
        self.service = DemoService(client_factory=lambda endpoint, **kwargs: self.client,
                                    runner=runner, fixture_exists=lambda: True)
        self.service.project_root = self.project_root
        self.server = create_server(self.service)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.addCleanup(self.close_server)
        self.base = f"http://127.0.0.1:{self.server.server_port}"

    def close_server(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)

    def _write_assets(self):
        assets = {
            "docs/demos/pycon-2026/evidence/report.json": '{"schema":"pudu.report/v1"}',
            "docs/demos/pycon-2026/evidence/report.md": "# Deterministic report\n",
            "docs/demos/pycon-2026/DEMO_RUNBOOK.es.md": "# Guía de demostración\n",
            "docs/demos/pycon-2026/transformers-demo.captions.es.vtt": "WEBVTT\n",
            "docs/demos/pycon-2026/pycon-2026-transformers-demo.mp4": "fake-video",
        }
        for relative, content in assets.items():
            path = self.project_root / relative
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding="utf-8")
        manifest = self.project_root / ".pudu-ai" / "pycon-demo" / f"{self.manifest_id}.json"
        manifest.parent.mkdir(parents=True)
        manifest.write_text('{"model":{"tag":"local"},"api_key":"example-secret",'
                            '"details":"/Volumes/KINGSTON/private"}', encoding="utf-8")

    def request(self, path, method="GET", body=None, headers=None):
        payload = None if body is None else json.dumps(body).encode()
        request = Request(self.base + path, data=payload, method=method, headers=headers or {})
        return urlopen(request)

    def test_models_and_preflight_are_read_only(self):
        preflight = json.load(self.request("/api/preflight"))
        models = json.load(self.request("/api/models"))
        self.assertEqual(preflight["fixture"]["revision"], "18329f1065382e54db698e242cf98bd3f3e5a766")
        self.assertEqual(models["models"], [{"tag": "qwen2.5:7b", "digest": "sha256:abc"}])
        self.assertEqual(self.calls, [])

    def test_run_requires_and_revalidates_exact_tag_and_digest(self):
        with self.assertRaises(HTTPError):
            self.request("/api/runs", "POST", {"model": "qwen2.5:7b"})
        self.assertEqual(self.calls, [])
        response = self.request("/api/runs", "POST", {"model": "qwen2.5:7b", "digest": "sha256:abc"})
        run_id = json.load(response)["run_id"]
        self.assertEqual(self.calls, [("qwen2.5:7b", "sha256:abc")])
        result = json.load(self.request(f"/api/runs/{run_id}"))
        self.assertEqual(result["status"], "completed")
        self.assertNotIn("prompt_text", result)

    def test_changed_digest_blocks_run(self):
        self.client.models = [ModelInfo("qwen2.5:7b", "sha256:changed")]
        with self.assertRaises(HTTPError):
            self.request("/api/runs", "POST", {"model": "qwen2.5:7b", "digest": "sha256:abc"})
        self.assertEqual(self.calls, [])

    def test_mutation_requires_same_host_and_origin(self):
        with self.assertRaises(HTTPError):
            self.request("/api/runs", "POST", {"model": "qwen2.5:7b", "digest": "sha256:abc"},
                         {"Host": "evil.example"})
        with self.assertRaises(HTTPError):
            self.request("/api/runs", "POST", {"model": "qwen2.5:7b", "digest": "sha256:abc"},
                         {"Origin": "https://evil.example"})
        self.assertEqual(self.calls, [])

    def test_body_limit_and_fixed_routes_reject_oversize_and_traversal(self):
        oversized = Request(self.base + "/api/runs", data=b"{" + b" " * 5000 + b"}", method="POST",
                            headers={"Content-Type": "application/json"})
        with self.assertRaises(HTTPError):
            urlopen(oversized)
        for path in ("/../etc/passwd", "/api/runs/../secret", "/api/anything"):
            with self.assertRaises(HTTPError):
                self.request(path)
        self.assertEqual(self.calls, [])

    def test_run_events_preserve_observed_order_and_are_bounded(self):
        run_id = json.load(self.request("/api/runs", "POST", {"model": "qwen2.5:7b", "digest": "sha256:abc"}))[
            "run_id"]
        events = json.load(self.request(f"/api/runs/{run_id}/events"))["events"]
        stages = [event["stage"] for event in events]
        self.assertLess(stages.index("evidence"), stages.index("generation"))
        self.assertLessEqual(len(events), 100)

    def test_only_one_analysis_run_can_be_active(self):
        self.block_runner = True
        first = json.load(self.request("/api/runs", "POST", {"model": "qwen2.5:7b", "digest": "sha256:abc"}))
        deadline = time.monotonic() + 1
        while self.service.get_run(first["run_id"])["status"] != "running" and time.monotonic() < deadline:
            time.sleep(0.005)
        with self.assertRaises(HTTPError) as raised:
            self.request("/api/runs", "POST", {"model": "qwen2.5:7b", "digest": "sha256:abc"})
        self.assertEqual(raised.exception.code, 409)
        self.release_runner.set()

    def test_failure_and_result_limits_are_reported_as_bounded_failed_runs(self):
        self.runner_error = RuntimeError("injected failure")
        run_id = json.load(self.request("/api/runs", "POST", {"model": "qwen2.5:7b", "digest": "sha256:abc"}))["run_id"]
        deadline = time.monotonic() + 1
        while self.service.get_run(run_id)["status"] == "queued" and time.monotonic() < deadline:
            time.sleep(0.005)
        failed = self.service.get_run(run_id)
        self.assertEqual(failed["status"], "failed")
        self.assertLessEqual(len(failed["error"]), 400)
        exposed = json.dumps({"status": failed, "events": self.service.get_events(run_id)})
        self.assertNotIn("injected failure", exposed)
        self.assertNotIn("API_KEY=", exposed)
        self.runner_error = None
        self.runner_response = {"summary": "x" * (16 * 1024), "findings": []}
        second = json.load(self.request("/api/runs", "POST", {"model": "qwen2.5:7b", "digest": "sha256:abc"}))["run_id"]
        deadline = time.monotonic() + 1
        while self.service.get_run(second)["status"] == "queued" and time.monotonic() < deadline:
            time.sleep(0.005)
        bounded = self.service.get_run(second)
        self.assertEqual(bounded["status"], "completed")
        self.assertLessEqual(len(json.dumps(bounded).encode("utf-8")), 16 * 1024)

    def test_model_output_is_redacted_and_projected_recursively(self):
        self.runner_response = {
            "schema": "pudu.transformers-ollama-analysis/v1",
            "summary": "WORKSPACE_API_KEY=example-secret /Volumes/KINGSTON/private C:\\Users\\Jane\\private.txt " + "z" * 5000,
            "findings": [{"label": "UNRESOLVED", "claim": "Authorization: Bearer bearer-secret",
                          "rationale": "Nested secret", "evidence_refs": ["python/pudu_agent/demo.py:23",
                          "../secret", "/private/path"]}],
            "nested": {"API_KEY": "nested-secret", "deep": {"message": "token=deep-secret"}},
        }
        run_id = json.load(self.request("/api/runs", "POST", {"model": "qwen2.5:7b", "digest": "sha256:abc"}))[
            "run_id"]
        deadline = time.monotonic() + 1
        while self.service.get_run(run_id)["status"] == "queued" and time.monotonic() < deadline:
            time.sleep(0.005)
        body = json.dumps(self.service.get_run(run_id), ensure_ascii=False)
        for secret in ("example-secret", "KINGSTON/private", "C:\\\\Users", "Jane\\\\private.txt",
                       "bearer-secret", "nested-secret", "deep-secret"):
            self.assertNotIn(secret, body)
        self.assertIn("python/pudu_agent/demo.py:23", body)
        self.assertNotIn("../secret", body)
        self.assertLessEqual(len(body.encode("utf-8")), 16 * 1024)

    def test_exception_text_is_not_exposed_in_status_or_events(self):
        self.runner_error = RuntimeError("API_KEY=runner-secret C:\\private\\credential.txt")
        run_id = json.load(self.request("/api/runs", "POST", {"model": "qwen2.5:7b", "digest": "sha256:abc"}))[
            "run_id"]
        deadline = time.monotonic() + 1
        while self.service.get_run(run_id)["status"] == "queued" and time.monotonic() < deadline:
            time.sleep(0.005)
        payload = json.dumps({"status": self.service.get_run(run_id), "events": self.service.get_events(run_id)})
        self.assertNotIn("runner-secret", payload)
        self.assertNotIn("credential.txt", payload)
        self.assertEqual(self.service.get_run(run_id)["error"], "Analysis failed.")

    def test_manifest_route_is_uuid_confined_and_redacted(self):
        response = json.load(self.request(f"/api/manifests/{self.manifest_id}"))
        body = json.dumps(response)
        self.assertNotIn("example-secret", body)
        self.assertNotIn("/Volumes/KINGSTON/private", body)
        with self.assertRaises(HTTPError) as raised:
            self.request("/api/manifests/../secret")
        self.assertEqual(raised.exception.code, 404)
        with self.assertRaises(HTTPError):
            self.request("/api/manifests/not-a-uuid")

    def test_manifest_route_rejects_symlinks_and_oversized_files(self):
        manifest_dir = self.project_root / ".pudu-ai" / "pycon-demo"
        (manifest_dir / f"{self.manifest_id}.json").unlink()
        outside = self.project_root / "outside.json"
        outside.write_text('{"secret":"outside"}', encoding="utf-8")
        (manifest_dir / f"{self.manifest_id}.json").symlink_to(outside)
        with self.assertRaises(HTTPError):
            self.request(f"/api/manifests/{self.manifest_id}")
        (manifest_dir / f"{self.manifest_id}.json").unlink()
        (manifest_dir / f"{self.manifest_id}.json").write_text("x" * (64 * 1024 + 1), encoding="utf-8")
        with self.assertRaises(HTTPError):
            self.request(f"/api/manifests/{self.manifest_id}")

    def test_presentation_asset_routes_use_only_the_fixed_allowlist(self):
        routes = ("report.json", "report.md", "runbook.es.md", "captions.es.vtt", "video.mp4")
        for route in routes:
            with self.subTest(route=route):
                response = self.request(f"/api/presentation/{route}")
                self.assertTrue(response.headers.get_content_type())
                self.assertGreater(len(response.read()), 0)
        for route in ("../../etc/passwd", "unknown.txt", "report.json/../../secret"):
            with self.subTest(route=route), self.assertRaises(HTTPError):
                self.request(f"/api/presentation/{route}")

    def test_start_rejects_unknown_fields_and_bad_json(self):
        with self.assertRaises(HTTPError):
            self.request("/api/runs", "POST", {"model": "qwen2.5:7b", "digest": "sha256:abc", "path": "/tmp"})
        self.assertEqual(self.calls, [])


if __name__ == "__main__":
    unittest.main()
