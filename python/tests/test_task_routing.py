import sys
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from pudu_agent.task import Task
from pudu_agent.router import Effort, analyze_effort, route_model
from pudu_agent.verifier import verify_response

class RouterTests(unittest.TestCase):
    def task(self, kind="analysis", **kwargs):
        return Task.from_dict({"kind": kind, "prompt": "summarize app", **kwargs})

    def test_effort_maps_kind_and_repository_metrics_without_quality_claims(self):
        self.assertEqual(analyze_effort(self.task("summary")).effort, Effort.LOW)
        self.assertEqual(analyze_effort(self.task("analysis")).effort, Effort.MEDIUM)
        self.assertEqual(analyze_effort(self.task("code_review")).effort, Effort.HIGH)
        large = analyze_effort(self.task("analysis"), {"file_count": 1200})
        self.assertEqual(large.effort, Effort.HIGH)
        self.assertEqual(analyze_effort(self.task("code_review"), {"file_count": 1200}).effort, Effort.VERY_HIGH)
        self.assertNotIn("quality", large.reason.lower())

    def test_explicit_model_must_be_installed_and_cloud_is_not_routed(self):
        client = mock.Mock()
        client.list_models.return_value = ["alpha:latest", "beta:latest"]
        route = route_model(self.task(model="beta:latest"), client)
        self.assertEqual((route.model, route.origin), ("beta:latest", "DERIVED"))
        with self.assertRaises(ValueError):
            route_model(self.task(model="missing"), client)

    def test_auto_route_uses_structural_history_or_deterministic_fallback(self):
        client = mock.Mock()
        client.list_models.return_value = ["zeta", "alpha"]
        fallback = route_model(self.task(), client)
        self.assertEqual(fallback.model, "alpha")
        self.assertEqual(fallback.origin, "DERIVED")
        self.assertIn("no quality evidence", fallback.reason)
        client.list_models.return_value = []
        with self.assertRaises(ValueError):
            route_model(self.task(), client)
        client.list_models.return_value = ["zeta", "alpha"]
        history = [{"model": "zeta", "status": "success", "verification": {"status": "passed"}}]
        selected = route_model(self.task(), client, history=history)
        self.assertEqual(selected.model, "zeta")
        self.assertIn("structural", selected.reason)
