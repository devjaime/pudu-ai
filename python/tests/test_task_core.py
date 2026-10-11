import json
import sys
import unittest
from pathlib import Path
from unittest import mock
from urllib.error import URLError

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from pudu_agent.model_client import OllamaClient, OllamaError, validate_endpoint
from pudu_agent.task import Task, TaskKind


class TaskTests(unittest.TestCase):
    def test_parses_supported_text_task(self):
        task = Task.from_dict({"kind": "analysis", "text": "Inspect this code"})
        self.assertEqual(task.kind, TaskKind.ANALYSIS)
        self.assertEqual(task.text, "Inspect this code")
        self.assertEqual(task.to_dict(), {"kind": "analysis", "text": "Inspect this code"})

    def test_all_supported_kinds_parse(self):
        for kind in ("analysis", "summary", "code_review", "test_generation", "documentation"):
            with self.subTest(kind=kind):
                self.assertEqual(Task.from_dict({"kind": kind, "text": "x"}).kind.value, kind)

    def test_rejects_invalid_kind_and_non_text(self):
        with self.assertRaises(ValueError):
            Task.from_dict({"kind": "shell", "text": "do work"})
        with self.assertRaises(ValueError):
            Task.from_dict({"kind": "summary", "text": 42})
        with self.assertRaises(ValueError):
            Task.from_dict({"kind": "summary", "text": "  "})


class EndpointTests(unittest.TestCase):
    def test_accepts_loopback_and_normalizes_trailing_slash(self):
        self.assertEqual(validate_endpoint("http://127.0.0.1:11434/"), "http://127.0.0.1:11434")
        self.assertEqual(validate_endpoint("http://[::1]:11434"), "http://[::1]:11434")

    def test_rejects_remote_credentials_and_unsupported_schemes(self):
        for endpoint in ("https://ollama.example", "http://192.168.1.5:11434", "http://user:pw@localhost:11434", "file:///tmp/x"):
            with self.subTest(endpoint=endpoint), self.assertRaises(ValueError):
                validate_endpoint(endpoint)


class OllamaClientTests(unittest.TestCase):
    def setUp(self):
        self.client = OllamaClient("http://localhost:11434", timeout=1)

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
    def test_rejects_cloud_model_tags(self, urlopen):
        urlopen.return_value = self.response({"models": [{"name": "qwen:cloud"}]})
        with self.assertRaises(OllamaError):
            self.client.list_models()

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
        client = OllamaClient("http://localhost:11434", max_response_bytes=8)
        with self.assertRaises(OllamaError):
            client.health()

    @mock.patch("pudu_agent.model_client.urlopen")
    def test_generate_preserves_absent_metrics(self, urlopen):
        urlopen.return_value = self.response({"response": "answer", "done": True})
        result = self.client.generate("llama3:latest", "prompt")
        self.assertEqual(result.text, "answer")
        self.assertIsNone(result.total_duration)
        self.assertIsNone(result.eval_count)
        request = urlopen.call_args.args[0]
        self.assertEqual(request.full_url, "http://localhost:11434/api/generate")

    @mock.patch("pudu_agent.model_client.urlopen", side_effect=URLError("offline"))
    def test_unavailable_ollama_becomes_domain_error(self, _urlopen):
        with self.assertRaises(OllamaError):
            self.client.health()


if __name__ == "__main__":
    unittest.main()
