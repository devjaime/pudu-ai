import json
import tempfile
import unittest
from pathlib import Path

from pudu_agent.transformers_report import build_report, render_markdown, write_report


class TransformersReportTests(unittest.TestCase):
    def fixture_data(self, root):
        source = root / "src/transformers/generation/utils.py"
        source.parent.mkdir(parents=True)
        source.write_text("line one\nline two\nline three\n")
        pipeline = root / "src/transformers/pipelines/text_generation.py"
        pipeline.parent.mkdir(parents=True)
        pipeline.write_text("caller source\n")
        evidence = {
            "schema": "pudu.transformers-evidence/v1",
            "repository": {"name": "huggingface/transformers", "tag": "v5.20.2", "revision": "18329f1065382e54db698e242cf98bd3f3e5a766"},
            "target": "GenerationMixin.generate",
            "evidence": {
                "definition": [{"symbol": "GenerationMixin", "path": "src/transformers/generation/utils.py", "line_start": 1, "line_end": 3, "relationship": "defines generation mixin", "label": "CONFIRMED"}, {"symbol": "generate", "path": "src/transformers/generation/utils.py", "line_start": 2, "line_end": 2, "relationship": "defines generate method", "label": "CONFIRMED"}],
                "pipeline_caller": [{"symbol": "call", "path": "src/transformers/pipelines/text_generation.py", "line_start": 1, "line_end": 1, "relationship": "calls generate on model", "label": "CONFIRMED"}], "model_inheritance": [], "configuration": [], "tests": [],
            },
            "limitations": ["Static evidence is incomplete runtime proof."],
        }
        return evidence

    def test_report_contract_and_markdown_are_deterministic(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            evidence = self.fixture_data(root)
            report = build_report(evidence, root)
            markdown = render_markdown(report)
            self.assertEqual(report, build_report(evidence, root))
            self.assertEqual(markdown, render_markdown(build_report(evidence, root)))
            self.assertEqual(report["stages"][-1]["status"], "NOT_RUN")
            self.assertEqual(report["stages"][-1]["name"], "MODEL_ANALYSIS")
            self.assertIn("context_reduction", report)
            self.assertIn("GenerationMixin.generate", markdown)
            self.assertNotIn(str(root), json.dumps(report) + markdown)

    def test_writes_json_and_markdown_from_same_report(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            evidence = self.fixture_data(root)
            output = root / "out"
            json_path, markdown_path = write_report(evidence, root, output)
            report = json.loads(json_path.read_text())
            self.assertEqual(markdown_path.read_text(), render_markdown(report))
            self.assertEqual(report["repository"]["revision"], evidence["repository"]["revision"])

    def test_rejects_missing_required_claim_evidence(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            evidence = self.fixture_data(root)
            evidence["evidence"]["definition"] = []
            with self.assertRaisesRegex(ValueError, "requires GenerationMixin.generate"):
                build_report(evidence, root)


if __name__ == "__main__":
    unittest.main()
