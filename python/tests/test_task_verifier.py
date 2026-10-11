import sys
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from pudu_agent.task import Task
from pudu_agent.router import Effort, analyze_effort, route_model
from pudu_agent.verifier import verify_response

class VerifierTests(unittest.TestCase):
    def test_structural_verification_never_claims_factual_correctness(self):
        passed = verify_response("A sufficiently long answer.", min_length=10)
        self.assertEqual((passed.level, passed.status), ("STRUCTURAL", "passed"))
        self.assertFalse(passed.factual_correctness_checked)
        self.assertEqual(verify_response("", min_length=1).status, "failed")
        self.assertEqual(verify_response("not JSON", json_schema={"required": []}).status, "failed")

    def test_optional_required_fields_are_structural(self):
        result = verify_response('{"ok": true}', json_schema={"required": ["ok", "data"]})
        self.assertEqual(result.status, "failed")
        self.assertIn("data", result.checks[-1])
        wrong_type = verify_response('{"ok": "yes"}', json_schema={"properties": {"ok": {"type": "boolean"}}})
        self.assertEqual(wrong_type.status, "failed")
