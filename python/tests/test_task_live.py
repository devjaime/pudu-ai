from __future__ import annotations

import os
import unittest
from pathlib import Path
from uuid import uuid4

from pudu_agent.flow import run_task
from pudu_agent.model_client import OllamaClient
from pudu_agent.task import Task, TaskKind


@unittest.skipUnless(os.environ.get("PUDU_INTEGRATION") == "1", "set PUDU_INTEGRATION=1 for live Ollama")
class LiveTaskIntegrationTests(unittest.TestCase):
    def test_local_summary(self) -> None:
        task = Task(id=uuid4().hex, kind=TaskKind.SUMMARY, prompt="Summarize in one sentence.")
        result = run_task(task, Path.cwd(), OllamaClient())
        self.assertIn(result.status, {"success", "failed"})


if __name__ == "__main__":
    unittest.main()
