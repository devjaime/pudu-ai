import json
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import pudu_agent.transformers_evidence as evidence_module
from pudu_agent.transformers_evidence import collect_evidence


class TransformersEvidenceTests(unittest.TestCase):
    def make_fixture(self, root):
        files = {
            "src/transformers/generation/utils.py": "class GenerationMixin:\n    def generate(self):\n        pass\n",
            "src/transformers/models/example/modeling_example.py": "from transformers.generation import GenerationMixin\nclass Model(GenerationMixin):\n    pass\n",
            "src/transformers/pipelines/text_generation.py": "class TextGenerationPipeline:\n    def __call__(self):\n        return self.model.generate()\n",
            "src/transformers/generation/configuration_utils.py": "class GenerationConfig:\n    pass\nclass CompileConfig:\n    pass\n",
            "tests/generation/test_utils.py": "class Fake:\n    def generate(self):\n        pass\ndef test_generate():\n    Fake().generate()\n",
        }
        for name, content in files.items():
            path = root / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content)
        subprocess.run(["git", "init", "-q", str(root)], check=True)
        subprocess.run(["git", "-C", str(root), "config", "user.email", "test@example.com"], check=True)
        subprocess.run(["git", "-C", str(root), "config", "user.name", "Test"], check=True)
        subprocess.run(["git", "-C", str(root), "add", "."], check=True)
        subprocess.run(["git", "-C", str(root), "commit", "-qm", "fixture"], check=True)
        subprocess.run(["git", "-C", str(root), "tag", "v5.20.2"], check=True)
        return subprocess.run(["git", "-C", str(root), "rev-parse", "HEAD"], check=True, capture_output=True, text=True).stdout.strip()

    def test_collects_deterministic_evidence_and_exact_config_contract(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            revision = self.make_fixture(root)
            with patch.object(evidence_module, "EXPECTED_COMMIT", revision):
                result = collect_evidence(root)
                self.assertEqual(result, collect_evidence(root))
            rendered = json.dumps(result, sort_keys=True)
            for item in ("GenerationMixin", "TextGenerationPipeline", "Model", "GenerationConfig", "test_utils.py"):
                self.assertIn(item, rendered)
            config_symbols = [item["symbol"] for item in result["evidence"]["configuration"]]
            self.assertEqual(config_symbols, ["GenerationConfig"])
            self.assertIn("CONFIRMED", rendered)
            self.assertIn("UNRESOLVED", rendered)

    def test_rejects_wrong_head_in_real_git_repository(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.make_fixture(root)
            with patch.object(evidence_module, "EXPECTED_COMMIT", "0" * 40):
                with self.assertRaisesRegex(ValueError, "Expected Transformers commit"):
                    collect_evidence(root)

    def test_rejects_repository_subdirectory(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            revision = self.make_fixture(root)
            with patch.object(evidence_module, "EXPECTED_COMMIT", revision):
                with self.assertRaisesRegex(ValueError, "repository root"):
                    collect_evidence(root / "src")

    def test_rejects_checkout_without_required_definition_or_caller(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            revision = self.make_fixture(root)
            (root / "src/transformers/generation/utils.py").write_text("class Other: pass\n")
            (root / "src/transformers/pipelines/text_generation.py").write_text("class OtherPipeline: pass\n")
            with patch.object(evidence_module, "EXPECTED_COMMIT", revision):
                with self.assertRaisesRegex(ValueError, "required evidence"):
                    collect_evidence(root)

    def test_rejects_wrong_tag_in_real_git_repository(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            revision = self.make_fixture(root)
            with patch.object(evidence_module, "EXPECTED_COMMIT", revision), patch.object(evidence_module, "EXPECTED_TAG", "not-v5.20.2"):
                with self.assertRaisesRegex(ValueError, "Expected Transformers tag"):
                    collect_evidence(root)


if __name__ == "__main__":
    unittest.main()
