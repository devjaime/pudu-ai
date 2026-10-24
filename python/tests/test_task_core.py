import json
import sys
import unittest
from pathlib import Path
from unittest import mock
from urllib.error import URLError

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from pudu_agent.model_client import ModelInfo, OllamaClient, OllamaError, validate_endpoint
from pudu_agent.task import Task, TaskKind


class TaskTests(unittest.TestCase):
    def test_parses_supported_text_task(self):
        task = Task.from_dict({"id": "task-1", "kind": "analysis", "prompt": "Inspect this code"})
        self.assertEqual(task.kind, TaskKind.ANALYSIS)
        self.assertEqual(task.prompt, "Inspect this code")
        self.assertEqual(task.to_dict(), {"id": "task-1", "kind": "analysis", "prompt": "Inspect this code", "repository": None, "effort": None, "model": None, "metadata": {}})

    def test_all_supported_kinds_parse(self):
        for kind in ("analysis", "summary", "code_review", "test_generation", "documentation"):
            with self.subTest(kind=kind):
                self.assertEqual(Task.from_dict({"kind": kind, "prompt": "x"}).kind.value, kind)

    def test_rejects_invalid_kind_and_non_text(self):
        with self.assertRaises(ValueError):
            Task.from_dict({"kind": "shell", "prompt": "do work"})
        with self.assertRaises(ValueError):
            Task.from_dict({"kind": "summary", "prompt": 42})
        with self.assertRaises(ValueError):
            Task.from_dict({"kind": "summary", "prompt": "  "})

    def test_task_defaults_and_metadata_are_defensively_copied(self):
        metadata = {"labels": ["safe"]}
        task = Task.from_dict({"kind": "analysis", "prompt": "Inspect", "metadata": metadata})
        metadata["labels"].append("outside")
        self.assertEqual(task.metadata["labels"], ["safe"])
        self.assertNotEqual(task.id, "")
        task_dict = task.to_dict()
        task_dict["metadata"]["labels"].append("returned")
        self.assertEqual(task.metadata["labels"], ["safe"])

    def test_task_validates_optional_field_types(self):
        for field, value in (("repository", 3), ("effort", []), ("model", False), ("metadata", "x")):
            with self.subTest(field=field), self.assertRaises(ValueError):
                Task.from_dict({"kind": "summary", "prompt": "summarize", field: value})


class EndpointTests(unittest.TestCase):
    def test_accepts_loopback_and_normalizes_trailing_slash(self):
        self.assertEqual(validate_endpoint("http://127.0.0.1:11434/"), "http://127.0.0.1:11434")
        self.assertEqual(validate_endpoint("http://[::1]:11434"), "http://[::1]:11434")
        self.assertEqual(OllamaClient().endpoint, "http://127.0.0.1:11434")

    def test_rejects_remote_credentials_and_unsupported_schemes(self):
        for endpoint in ("https://ollama.example", "http://192.168.1.5:11434", "http://localhost:11434", "http://user:pw@127.0.0.1:11434", "file:///tmp/x"):
            with self.subTest(endpoint=endpoint), self.assertRaises(ValueError):
                validate_endpoint(endpoint)


class OllamaClientTests(unittest.TestCase):
    def setUp(self):
        self.client = OllamaClient("http://127.0.0.1:11434", timeout=1)

    @staticmethod
    def response(payload, status=200):
        response = mock.MagicMock()
        response.status = status
        response.read.return_value = json.dumps(payload).encode()
        response.__enter__.return_value = response
        response.__exit__.return_value = None
        return response

    @mock.patch("pudu_agent.model_client.urlopen")
    def test_lists_models_and_detects_no_installed_models(self, urlopen):
        urlopen.return_value = self.response({"models": []})
        self.assertEqual(self.client.list_models(), [])
        self.assertIsNone(self.client.select_model())

    @mock.patch("pudu_agent.model_client.urlopen")
    def test_model_details_preserve_tag_and_digest_while_list_models_stays_compatible(self, urlopen):
        payload = {"models": [{"name": "llama3:latest", "model": "llama3:latest", "digest": "sha256:abc"}]}
        urlopen.return_value = self.response(payload)
        self.assertEqual(self.client.list_model_details(), [ModelInfo(tag="llama3:latest", digest="sha256:abc")])
        urlopen.return_value = self.response(payload)
        self.assertEqual(self.client.list_models(), ["llama3:latest"])

    @mock.patch("pudu_agent.model_client.urlopen")
    def test_model_details_accept_missing_digest_but_reject_malformed_digest(self, urlopen):
        urlopen.return_value = self.response({"models": [{"name": "llama3:latest"}]})
        self.assertEqual(self.client.list_model_details(), [ModelInfo(tag="llama3:latest", digest=None)])
        urlopen.return_value = self.response({"models": [{"name": "llama3:latest", "digest": 7}]})
        with self.assertRaises(OllamaError):
            self.client.list_model_details()

    @mock.patch("pudu_agent.model_client.urlopen")
    def test_server_version_is_validated(self, urlopen):
        urlopen.return_value = self.response({"version": "0.6.8"})
        self.assertEqual(self.client.server_version(), "0.6.8")
        self.assertEqual(urlopen.call_args.args[0].full_url, "http://127.0.0.1:11434/api/version")
        for payload in ({}, {"version": ""}, {"version": " "}, {"version": 7},
                        {"version": "v" * 129}, {"version": "v1\ninvalid"}):
            urlopen.return_value = self.response(payload)
            with self.subTest(payload=payload), self.assertRaises(OllamaError):
                self.client.server_version()

    @mock.patch("pudu_agent.model_client.urlopen")
    def test_rejects_cloud_model_tags(self, urlopen):
        urlopen.return_value = self.response({"models": [{"name": "gemma4:31b-cloud"}, {"name": "qwen:cloud"}, {"name": "llama3:latest"}]})
        self.assertEqual(self.client.list_models(), ["llama3:latest"])
        with self.assertRaises(OllamaError):
            self.client.select_model("gemma4:31b-cloud")

    @mock.patch("pudu_agent.model_client.urlopen")
    def test_missing_explicit_preferred_model_does_not_fall_back(self, urlopen):
        urlopen.return_value = self.response({"models": [{"name": "alpha:latest"}]})
        with self.assertRaises(OllamaError):
            self.client.select_model("missing:latest")
        self.assertEqual(self.client.select_model("alpha:latest"), "alpha:latest")

    def test_transport_disables_proxies_and_redirects(self):
        import urllib.request
        from pudu_agent.model_client import _NoRedirect, _opener

        self.assertTrue(any(isinstance(handler, _NoRedirect) for handler in _opener.handlers))
        self.assertFalse(any(isinstance(handler, urllib.request.ProxyHandler) for handler in _opener.handlers))
        self.assertIsNot(_opener, urllib.request._opener)
        redirect = next(handler for handler in _opener.handlers if isinstance(handler, _NoRedirect))
        self.assertIsNone(redirect.redirect_request(None, None, 302, "Found", {}, "http://localhost/next"))

    @mock.patch("pudu_agent.model_client.urlopen")
    def test_response_size_is_bounded(self, urlopen):
        response = self.response({"models": []})
        response.read.return_value = b"x" * 9
        urlopen.return_value = response
        client = OllamaClient("http://127.0.0.1:11434", max_response_bytes=8)
        with self.assertRaises(OllamaError):
            client.health()

    @mock.patch("pudu_agent.model_client.urlopen")
    def test_generate_preserves_absent_metrics(self, urlopen):
        urlopen.return_value = self.response({"model": "llama3:latest", "response": "answer", "done": True})
        result = self.client.generate("llama3:latest", "prompt")
        self.assertEqual(result.model, "llama3:latest")
        self.assertEqual(result.content, "answer")
        self.assertIsNone(result.prompt_tokens)
        self.assertIsNone(result.completion_tokens)
        self.assertIsNone(result.total_tokens)
        self.assertIsNone(result.tokens_per_second)
        self.assertIsNone(result.total_duration)
        request = urlopen.call_args.args[0]
        self.assertEqual(request.full_url, "http://127.0.0.1:11434/api/generate")

    @mock.patch("pudu_agent.model_client.urlopen")
    def test_generate_maps_and_derives_only_observed_metrics(self, urlopen):
        urlopen.return_value = self.response({"model": "llama3:latest", "response": "answer", "prompt_eval_count": 7, "eval_count": 5, "total_duration": 3_000_000_000, "load_duration": 1_000_000_000, "eval_duration": 2_000_000_000})
        result = self.client.generate("llama3:latest", "prompt")
        self.assertEqual((result.prompt_tokens, result.completion_tokens, result.total_tokens), (7, 5, 12))
        self.assertEqual(result.tokens_per_second, 2.5)
        self.assertEqual((result.total_duration, result.load_duration, result.eval_duration), (3_000_000_000, 1_000_000_000, 2_000_000_000))

    @mock.patch("pudu_agent.model_client.urlopen")
    def test_generate_allows_json_format_and_reproducibility_options(self, urlopen):
        urlopen.return_value = self.response({"response": "{}"})
        self.client.generate("llama3:latest", "prompt", format="json", options={"temperature": 0, "seed": 17})
        request = json.loads(urlopen.call_args.args[0].data)
        self.assertEqual(request["format"], "json")
        self.assertEqual(request["options"], {"temperature": 0, "seed": 17})

    def test_generate_rejects_invalid_format_and_options(self):
        for kwargs in (
            {"format": "yaml"},
            {"format": {"type": "object"}},
            {"options": []},
            {"options": {"temperature": True}},
            {"options": {"temperature": 3}},
            {"options": {"seed": -1}},
            {"options": {"seed": True}},
            {"options": {"num_ctx": 4096}},
        ):
            with self.subTest(kwargs=kwargs), self.assertRaises(ValueError):
                self.client.generate("llama3:latest", "prompt", **kwargs)

    @mock.patch("pudu_agent.model_client.urlopen", side_effect=URLError("offline"))
    def test_unavailable_ollama_becomes_domain_error(self, _urlopen):
        with self.assertRaises(OllamaError):
            self.client.health()


if __name__ == "__main__":
    unittest.main()
