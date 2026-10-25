import json
import threading
import time
import unittest
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
            return self.runner_response, ".pudu-ai/pycon-demo/demo.json"

        self.service = DemoService(client_factory=lambda endpoint, **kwargs: self.client,
                                    runner=runner, fixture_exists=lambda: True)
        self.server = create_server(self.service)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.addCleanup(self.close_server)
        self.base = f"http://127.0.0.1:{self.server.server_port}"

    def close_server(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)

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
        self.runner_error = None
        self.runner_response = {"summary": "x" * (16 * 1024), "findings": []}
        second = json.load(self.request("/api/runs", "POST", {"model": "qwen2.5:7b", "digest": "sha256:abc"}))["run_id"]
        deadline = time.monotonic() + 1
        while self.service.get_run(second)["status"] == "queued" and time.monotonic() < deadline:
            time.sleep(0.005)
        self.assertEqual(self.service.get_run(second)["status"], "failed")

    def test_start_rejects_unknown_fields_and_bad_json(self):
        with self.assertRaises(HTTPError):
            self.request("/api/runs", "POST", {"model": "qwen2.5:7b", "digest": "sha256:abc", "path": "/tmp"})
        self.assertEqual(self.calls, [])


if __name__ == "__main__":
    unittest.main()
