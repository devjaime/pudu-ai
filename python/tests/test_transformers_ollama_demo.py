import hashlib
import io
import json
import tempfile
import unittest
import uuid
from contextlib import redirect_stderr
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from pudu_agent.model_client import GenerateResult, ModelInfo, OllamaError
import pudu_agent.transformers_ollama_demo as demo_module
from pudu_agent.transformers_ollama_demo import main, run_demo


class FakeClient:
    def __init__(self, *, models=None, version="0.6.8", result=None, error=None):
        self.models = models or [ModelInfo("qwen2.5:7b", "sha256:abc")]
        self.version = version
        self.result = result or GenerateResult("qwen2.5:7b", '{"schema":"pudu.transformers-ollama-analysis/v1","summary":"Review needed","findings":[]}')
        self.error = error
        self.calls = []

    def list_model_details(self):
        self.calls.append(("models",))
        return self.models

    def server_version(self):
        self.calls.append(("version",))
        return self.version

    def generate(self, model, prompt, **kwargs):
        self.calls.append(("generate", model, kwargs))
        if self.error:
            raise self.error
        return self.result


class TransformersOllamaDemoTests(unittest.TestCase):
    def run_demo(self, args, *, client=None, input_value="1", evidence=None, endpoint=None, timeout=None):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        client = client or FakeClient()
        evidence = evidence or {"schema": "pudu.transformers-evidence/v1", "repository": {
            "name": "huggingface/transformers", "tag": "v5.20.2",
            "revision": "18329f1065382e54db698e242cf98bd3f3e5a766"}, "evidence": {"definition": []}}
        client.endpoint_calls = []

        def client_factory(validated_endpoint=None, **kwargs):
            client.endpoint_calls.append(validated_endpoint)
            client.timeout_calls = getattr(client, "timeout_calls", [])
            client.timeout_calls.append(kwargs.get("timeout"))
            return client

        with patch("pudu_agent.transformers_ollama_demo.PROJECT_ROOT", Path(temp.name)), \
             patch("pudu_agent.transformers_ollama_demo.FIXTURE_ROOT", Path(temp.name)), \
             patch("pudu_agent.transformers_ollama_demo.collect_evidence", return_value=evidence) as collect, \
             patch("builtins.input", return_value=input_value), \
             patch("sys.stdout.write") as output:
            cli_args = [*args, "--repository", temp.name]
            if endpoint is not None:
                cli_args.extend(["--ollama-url", endpoint])
            if timeout is not None:
                cli_args.extend(["--ollama-timeout-seconds", str(timeout)])
            if getattr(args, "ollama_timeout_seconds", None) is not None:
                cli_args.extend(["--ollama-timeout-seconds", str(args.ollama_timeout_seconds)])
            status = main(cli_args, client_factory=client_factory, input_fn=lambda _: input_value)
        return status, client, collect, "".join(call.args[0] for call in output.call_args_list), Path(temp.name)

    def test_automatic_mode_requires_explicit_installed_model_and_runs_json_generation(self):
        client = FakeClient()
        status, client, _, output, root = self.run_demo(["--model", "qwen2.5:7b"], client=client)
        self.assertEqual(status, 0)
        generate_call = next(call for call in client.calls if call[0] == "generate")
        self.assertEqual(generate_call[1], "qwen2.5:7b")
        self.assertEqual(generate_call[2], {"format": "json", "options": {"temperature": 0, "seed": 20260520}})
        self.assertEqual(client.endpoint_calls, ["http://127.0.0.1:11434"])
        self.assertEqual(client.timeout_calls, [120.0])
        self.assertIn('"findings": []', output)
        manifest = json.loads(next((root / ".pudu-ai" / "pycon-demo").glob("*.json")).read_text())
        self.assertEqual(manifest["model"], {"tag": "qwen2.5:7b", "digest": "sha256:abc"})
        self.assertEqual(manifest["validation"], {"status": "structurally_valid", "factual_correctness_checked": False})
        self.assertNotIn("prompt_text", manifest)
        self.assertNotIn("evidence_text", manifest)
        self.assertNotIn("response_text", manifest)
        self.assertEqual(manifest["evidence"]["sha256"], hashlib.sha256(json.dumps({"schema": "pudu.transformers-evidence/v1", "repository": {
            "name": "huggingface/transformers", "tag": "v5.20.2",
            "revision": "18329f1065382e54db698e242cf98bd3f3e5a766"}, "evidence": {"definition": []}}, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode()).hexdigest())

    def test_automatic_mode_never_selects_first_model(self):
        status, client, _, _, _ = self.run_demo([])
        self.assertNotEqual(status, 0)
        self.assertNotIn(("generate", "qwen2.5:7b", {"format": "json", "options": {"temperature": 0, "seed": 20260520}}), client.calls)

    def test_interactive_selection_is_bounded_and_requires_digest(self):
        client = FakeClient(models=[ModelInfo("qwen2.5:7b", "sha256:abc"), ModelInfo("llama3:8b", "sha256:def")],
                            result=GenerateResult("llama3:8b", '{"schema":"pudu.transformers-ollama-analysis/v1","summary":"Review needed","findings":[]}'))
        status, client, _, output, root = self.run_demo(["--interactive"], client=client, input_value="1",
                                                        endpoint="http://127.0.0.1:11435/", timeout=90)
        self.assertEqual(status, 0)
        self.assertIn("1)", output)
        self.assertIn("sha256:def", output)
        self.assertEqual(client.endpoint_calls, ["http://127.0.0.1:11435"])
        self.assertEqual(client.timeout_calls, [90.0])
        self.assertIn(("generate", "llama3:8b", {"format": "json", "options": {"temperature": 0, "seed": 20260520}}), client.calls)
        manifest = json.loads(next((root / ".pudu-ai" / "pycon-demo").glob("*.json")).read_text())
        self.assertEqual(manifest["ollama_endpoint"], "http://127.0.0.1:11435")
        self.assertEqual(manifest["ollama_timeout_seconds"], 90.0)

    def test_explicit_timeout_is_forwarded_and_recorded(self):
        args = SimpleNamespace(repository=Path("."), ollama_timeout_seconds=45.5)
        status, client, _, _, root = self.run_demo(["--model", "qwen2.5:7b"], client=FakeClient(),
                                                   timeout=args.ollama_timeout_seconds)
        self.assertEqual(status, 0)
        self.assertEqual(client.timeout_calls, [45.5])
        manifest = json.loads(next((root / ".pudu-ai" / "pycon-demo").glob("*.json")).read_text())
        self.assertEqual(manifest["ollama_timeout_seconds"], 45.5)

    def test_invalid_timeout_is_rejected_before_collector_or_client_creation(self):
        for timeout in (True, float("nan"), float("inf"), 0, -1, 600.1, 10**400):
            with self.subTest(timeout=timeout), tempfile.TemporaryDirectory() as tmp:
                args = SimpleNamespace(repository=Path(tmp), ollama_url="http://127.0.0.1:11434",
                                       ollama_timeout_seconds=timeout, model="qwen2.5:7b", interactive=False)
                collector_calls = []
                factory_calls = []
                with patch("pudu_agent.transformers_ollama_demo.PROJECT_ROOT", Path(tmp)), \
                     patch("pudu_agent.transformers_ollama_demo.FIXTURE_ROOT", Path(tmp)), \
                     patch("pudu_agent.transformers_ollama_demo.collect_evidence", side_effect=collector_calls.append):
                    with self.assertRaises(ValueError):
                        run_demo(args, client_factory=lambda *a, **kw: factory_calls.append((a, kw)))
                self.assertEqual(collector_calls, [])
                self.assertEqual(factory_calls, [])

    def test_rejects_fixture_identity_before_any_ollama_call(self):
        client = FakeClient()
        evidence = {"repository": {"name": "huggingface/transformers", "tag": "wrong", "revision": "wrong"}}
        status, client, collect, _, _ = self.run_demo(["--model", "qwen2.5:7b"], client=client, evidence=evidence)
        self.assertNotEqual(status, 0)
        self.assertEqual(client.calls, [])
        collect.assert_called_once()

    def test_rejects_wrong_fixture_root_before_collector_or_ollama(self):
        client = FakeClient()
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        with patch("pudu_agent.transformers_ollama_demo.PROJECT_ROOT", Path(temp.name)), \
             patch("pudu_agent.transformers_ollama_demo.FIXTURE_ROOT", Path(temp.name) / "expected"), \
             patch("pudu_agent.transformers_ollama_demo.collect_evidence") as collect:
            status = main(["--model", "qwen2.5:7b", "--repository", temp.name], client_factory=lambda: client)
        self.assertNotEqual(status, 0)
        collect.assert_not_called()
        self.assertEqual(client.calls, [])

    def test_cli_rejects_arbitrary_manifest_path_without_creating_it(self):
        with tempfile.TemporaryDirectory() as tmp:
            arbitrary = Path(tmp) / "outside"
            errors = io.StringIO()
            evidence = {"schema": "pudu.transformers-evidence/v1", "repository": {
                "name": "huggingface/transformers", "tag": "v5.20.2",
                "revision": "18329f1065382e54db698e242cf98bd3f3e5a766"}, "evidence": {"definition": []}}
            with patch("pudu_agent.transformers_ollama_demo.PROJECT_ROOT", Path(tmp)), \
                 patch("pudu_agent.transformers_ollama_demo.FIXTURE_ROOT", Path(tmp)), \
                 patch("pudu_agent.transformers_ollama_demo.collect_evidence", return_value=evidence), \
                 redirect_stderr(errors):
                try:
                    status = main(["--model", "qwen2.5:7b", "--repository", tmp,
                                   "--manifest-dir", str(arbitrary)], client_factory=FakeClient)
                except SystemExit as exc:
                    status = exc.code
            self.assertFalse(arbitrary.exists())
            self.assertNotEqual(status, 0)

    def test_manifest_writer_rejects_symlink_directory_without_writing_outside(self):
        for symlink_component in (".pudu-ai", "pycon-demo"):
            with self.subTest(symlink_component=symlink_component), tempfile.TemporaryDirectory() as tmp:
                project = Path(tmp) / "project"
                outside = Path(tmp) / "outside"
                project.mkdir()
                outside.mkdir()
                if symlink_component == ".pudu-ai":
                    (project / ".pudu-ai").symlink_to(outside, target_is_directory=True)
                else:
                    ai_dir = project / ".pudu-ai"
                    ai_dir.mkdir()
                    (ai_dir / "pycon-demo").symlink_to(outside, target_is_directory=True)
                manifest = {"run_id": str(uuid.uuid4()), "secret": "redacted"}
                with patch.object(demo_module, "PROJECT_ROOT", project):
                    with self.assertRaises((OSError, ValueError)):
                        demo_module._write_manifest(project / ".pudu-ai" / "pycon-demo", manifest)
                self.assertEqual(list(outside.iterdir()), [])

    def test_invalid_endpoint_is_rejected_before_collector_or_client_creation(self):
        endpoints = ("https://127.0.0.1:11435", "http://user:pass@127.0.0.1:11435",
                     "http://192.0.2.10:11435")
        for endpoint in endpoints:
            with self.subTest(endpoint=endpoint), tempfile.TemporaryDirectory() as tmp:
                args = SimpleNamespace(repository=Path(tmp), ollama_url=endpoint,
                                       model="qwen2.5:7b", interactive=False)
                evidence_calls = []
                client_calls = []
                client = FakeClient()

                def client_factory(validated_endpoint=None):
                    client_calls.append(validated_endpoint)
                    return client

                def collector(root):
                    evidence_calls.append(root)
                    raise AssertionError("collector must not run for an invalid endpoint")

                with patch("pudu_agent.transformers_ollama_demo.PROJECT_ROOT", Path(tmp)), \
                     patch("pudu_agent.transformers_ollama_demo.FIXTURE_ROOT", Path(tmp)), \
                     patch("pudu_agent.transformers_ollama_demo.collect_evidence", side_effect=collector):
                    with self.assertRaises(ValueError):
                        run_demo(args, client_factory=client_factory)
                self.assertEqual(evidence_calls, [])
                self.assertEqual(client_calls, [])

    def test_invalid_json_and_model_identity_are_rejected(self):
        client = FakeClient(result=GenerateResult("qwen2.5:7b", "not json"))
        status, _, _, _, _ = self.run_demo(["--model", "qwen2.5:7b"], client=client)
        self.assertNotEqual(status, 0)
        client = FakeClient(result=GenerateResult("other:tag", '{"schema":"pudu.transformers-ollama-analysis/v1","summary":"x","findings":[]}'))
        status, _, _, _, _ = self.run_demo(["--model", "qwen2.5:7b"], client=client)
        self.assertNotEqual(status, 0)

    def test_missing_digest_and_ollama_failure_are_clear_errors(self):
        status, client, _, _, _ = self.run_demo(["--model", "qwen2.5:7b"], client=FakeClient(models=[ModelInfo("qwen2.5:7b", None)]))
        self.assertNotEqual(status, 0)
        client = FakeClient(error=OllamaError("offline"))
        status, _, _, _, _ = self.run_demo(["--model", "qwen2.5:7b"], client=client)
        self.assertNotEqual(status, 0)

    def test_cancel_and_invalid_interactive_choice_do_not_generate(self):
        status, client, _, _, _ = self.run_demo(["--interactive"], input_value="q")
        self.assertNotEqual(status, 0)
        self.assertFalse(any(call[0] == "generate" for call in client.calls))
        status, client, _, _, _ = self.run_demo(["--interactive"], input_value="9")
        self.assertNotEqual(status, 0)
        self.assertFalse(any(call[0] == "generate" for call in client.calls))


if __name__ == "__main__":
    unittest.main()
