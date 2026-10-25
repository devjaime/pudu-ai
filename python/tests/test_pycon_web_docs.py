import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
README = ROOT / "README.md"
RUNBOOK = ROOT / "docs/demos/pycon-2026/DEMO_RUNBOOK.es.md"
WEB_COMMAND = "PYTHONPATH=python python3 -m pudu_agent.pycon_web --ollama-url http://127.0.0.1:11435 --port 8765"


class PyConWebDocumentationTests(unittest.TestCase):
    def test_readme_has_bilingual_web_quick_paths_and_valid_runbook_link(self):
        text = README.read_text(encoding="utf-8")
        for required in ("English quick path — web", "Español — acceso rápido web", WEB_COMMAND,
                         "http://127.0.0.1:8765", "OLLAMA_NO_CLOUD=1", "not API attestation",
                         "no demuestra corrección factual"):
            with self.subTest(required=required):
                self.assertIn(required, text)
        links = re.findall(r"\[[^]]+\]\(([^)]+)\)", text)
        self.assertIn("docs/demos/pycon-2026/DEMO_RUNBOOK.es.md", links)
        self.assertTrue((ROOT / "docs/demos/pycon-2026/DEMO_RUNBOOK.es.md").is_file())

    def test_runbook_documents_web_flow_and_direct_cli_fallback(self):
        text = RUNBOOK.read_text(encoding="utf-8")
        for required in ("Terminal 1", "Terminal 2", "OLLAMA_HOST=127.0.0.1:11435 OLLAMA_NO_CLOUD=1 ollama serve",
                         "OLLAMA_HOST=127.0.0.1:11435 ollama list", WEB_COMMAND,
                         "http://127.0.0.1:8765", "--port 8766", "Actualizar modelos", "Iniciar una corrida", "NOT_RUN",
                         "horizonte de polling no cancela", "no demuestra que sus afirmaciones sean ciertas",
                         "Ctrl-C", "ollama pull",
                         "pudu_agent.transformers_ollama_demo --ollama-url http://127.0.0.1:11435"):
            with self.subTest(required=required):
                self.assertIn(required, text)
        for target in ("evidence/report.md", "evidence/report.json"):
            self.assertTrue((RUNBOOK.parent / target).exists(), target)
        self.assertIn("pycon-2026-transformers-demo.mp4", text)


if __name__ == "__main__":
    unittest.main()
