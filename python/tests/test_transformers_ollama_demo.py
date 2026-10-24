import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from pudu_agent.model_client import GenerateResult, ModelInfo, OllamaError
from pudu_agent.transformers_ollama_demo import main


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
    def run_demo(self, args, *, client=None, input_value="1", evidence=None):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        client = client or FakeClient()
        evidence = evidence or {"schema": "pudu.transformers-evidence/v1", "repository": {
            "name": "huggingface/transformers", "tag": "v5.20.2",
            "revision": "18329f1065382e54db698e242cf98bd3f3e5a766"}, "evidence": {"definition": []}}
        with patch("pudu_agent.transformers_ollama_demo.FIXTURE_ROOT", Path(temp.name)), \
             patch("pudu_agent.transformers_ollama_demo.collect_evidence", return_value=evidence) as collect, \
             patch("builtins.input", return_value=input_value), \
             patch("sys.stdout.write") as output:
            status = main([*args, "--repository", temp.name, "--manifest-dir", str(Path(temp.name) / ".pudu-ai")],
                          client_factory=lambda: client, input_fn=lambda _: input_value)
        return status, client, collect, "".join(call.args[0] for call in output.call_args_list), Path(temp.name)

    def test_automatic_mode_requires_explicit_installed_model_and_runs_json_generation(self):
        client = FakeClient()
        status, client, _, output, root = self.run_demo(["--model", "qwen2.5:7b"], client=client)
        self.assertEqual(status, 0)
        generate_call = next(call for call in client.calls if call[0] == "generate")
        self.assertEqual(generate_call[1], "qwen2.5:7b")
        self.assertEqual(generate_call[2], {"format": "json", "options": {"temperature": 0, "seed": 20260520}})
        self.assertIn('"findings": []', output)
        manifest = json.loads(next((root / ".pudu-ai").rglob("*.json")).read_text())
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
        status, client, _, output, _ = self.run_demo(["--interactive"], client=client, input_value="1")
        self.assertEqual(status, 0)
        self.assertIn("1)", output)
        self.assertIn("sha256:def", output)
        self.assertIn(("generate", "llama3:8b", {"format": "json", "options": {"temperature": 0, "seed": 20260520}}), client.calls)

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
        with patch("pudu_agent.transformers_ollama_demo.FIXTURE_ROOT", Path(temp.name) / "expected"), \
             patch("pudu_agent.transformers_ollama_demo.collect_evidence") as collect:
            status = main(["--model", "qwen2.5:7b", "--repository", temp.name,
                           "--manifest-dir", str(Path(temp.name) / ".pudu-ai")], client_factory=lambda: client)
        self.assertNotEqual(status, 0)
        collect.assert_not_called()
        self.assertEqual(client.calls, [])

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
