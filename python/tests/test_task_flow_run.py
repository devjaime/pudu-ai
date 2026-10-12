import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from pudu_agent.flow import run_task
from pudu_agent.model_client import GenerateResult
from pudu_agent.task import Task

class FlowTests(unittest.TestCase):
    def task(self, root, **values):
        return Task.from_dict({"kind": "summary", "prompt": "Summarize README", "repository": str(root),
                               "model": "local", **values})

    def test_flow_success_runs_linear_steps_and_records_telemetry(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "README.md").write_text("Project summary details", encoding="utf-8")
            client = mock.Mock()
            client.list_models.return_value = ["local"]
            client.generate.return_value = GenerateResult("local", "A sufficiently long summary response.")
            result = run_task(self.task(root), root, client)
            self.assertEqual(result.status, "success")
            self.assertEqual([step.name for step in result.steps], ["analyze", "context", "route", "execute", "verify", "telemetry"])
            client.generate.assert_called_once()
            self.assertTrue(result.telemetry_path.is_file())
            self.assertNotIn("summary response", result.telemetry_path.read_text(encoding="utf-8"))

    def test_flow_failure_propagates_and_never_claims_success(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            client = mock.Mock()
            client.list_models.return_value = ["local"]
            client.generate.side_effect = RuntimeError("token=secret")
            result = run_task(self.task(root), root, client)
            self.assertEqual(result.status, "failed")
            self.assertEqual(result.failed_step, "execute")
            self.assertTrue(result.telemetry_path.is_file())
            saved = result.telemetry_path.read_text(encoding="utf-8")
            self.assertNotIn("secret", saved)
            self.assertEqual(client.generate.call_count, 1)

    def test_flow_never_marks_unverified_content_as_success(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            client = mock.Mock()
            client.list_models.return_value = ["local"]
            client.generate.return_value = GenerateResult("local", "")
            result = run_task(self.task(root), root, client)
            self.assertEqual(result.status, "failed")
            self.assertEqual(result.failed_step, "verify")
            self.assertEqual(result.verification.level, "STRUCTURAL")
            saved = json.loads(result.telemetry_path.read_text(encoding="utf-8"))
            self.assertEqual(saved["status"], "failed")
            self.assertNotIn("content", saved)

    def test_generated_command_text_is_not_executed(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            client = mock.Mock()
            client.list_models.return_value = ["local"]
            client.generate.return_value = GenerateResult("local", "Run `rm -rf /` now.")
            with mock.patch("subprocess.run") as run_process:
                result = run_task(self.task(root), root, client)
            self.assertEqual(result.status, "success")
            run_process.assert_not_called()
