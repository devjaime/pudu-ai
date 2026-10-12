from __future__ import annotations

import unittest
import sys
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from pudu_agent.search import handle_task


class TaskProtocolTests(unittest.TestCase):
    def test_unavailable_ollama_is_structured_and_does_not_crash(self) -> None:
        with patch("pudu_agent.model_client.OllamaClient") as client_type:
            client_type.return_value.health.side_effect = OSError("offline")
            response = handle_task({"task": "summarize", "repo": ".", "model": "auto", "taskId": "id-1"})
        self.assertFalse(response["ok"])
        self.assertEqual(response["op"], "task")
        self.assertEqual(response["taskId"], "id-1")
        self.assertIn("error", response)

    def test_no_installed_model_is_structured(self) -> None:
        with patch("pudu_agent.model_client.OllamaClient") as client_type:
            client_type.return_value.health.return_value = True
            client_type.return_value.list_models.return_value = []
            response = handle_task({"task": "summarize", "repo": ".", "model": "auto", "taskId": "id-2"})
        self.assertFalse(response["ok"])
        self.assertIn("model", response["error"].lower())


if __name__ == "__main__":
    unittest.main()
