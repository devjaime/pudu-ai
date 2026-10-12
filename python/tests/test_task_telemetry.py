import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from pudu_agent.telemetry import TelemetryError, write_run

class TelemetryTests(unittest.TestCase):
    def test_serialization_redacts_bodies_and_preserves_missing_metrics(self):
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            output = write_run(repo, "task-1", {"status": "failed", "prompt": "SECRET PROMPT", "context": "SECRET CONTEXT",
                "password": "secret-credential", "verification": {"level": "SECRET", "status": "failed", "details": "secret-credential"},
                "steps": [{"name": "execute", "status": "completed", "duration_ms": 4, "output": {"token": "secret-credential"}}],
                "metrics": {"total_duration": None, "prompt_tokens": "secret-credential"}})
            data = json.loads(output.read_text(encoding="utf-8"))
            self.assertEqual(data["metrics"]["total_duration"], None)
            self.assertNotIn("SECRET", output.read_text(encoding="utf-8"))
            self.assertNotIn("secret-credential", output.read_text(encoding="utf-8"))
            self.assertEqual(data["verification"]["level"], "STRUCTURAL")

    def test_telemetry_rejects_unknown_step_names_and_status_values(self):
        with tempfile.TemporaryDirectory() as tmp:
            output = write_run(Path(tmp), "task-3", {"status": "success", "steps": [
                {"name": "execute", "status": "completed", "duration_ms": 1},
                {"name": "token=supersecret", "status": "completed", "duration_ms": 2},
                {"name": "route", "status": "token=supersecret", "duration_ms": 3},
                {"name": ["secret"], "status": ["bad"], "duration_ms": 4},
            ], "verification": {"status": ["secret"]}, "status_extra": ["credential"]})
            text = output.read_text(encoding="utf-8")
            data = json.loads(text)
            self.assertEqual(data["steps"], [{"name": "execute", "status": "completed", "duration_ms": 1}])
            self.assertNotIn("supersecret", text)

    def test_telemetry_path_cannot_escape_repository_or_follow_symlink(self):
        with tempfile.TemporaryDirectory() as tmp, tempfile.TemporaryDirectory() as outside:
            with self.assertRaises(TelemetryError):
                write_run(Path(tmp), "../escape", {})
            repo = Path(tmp)
            (repo / ".pudu-ai").symlink_to(Path(outside), target_is_directory=True)
            with self.assertRaises(TelemetryError):
                write_run(repo, "task-2", {})
