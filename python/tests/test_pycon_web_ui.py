"""Static and route contracts for the local PyCon presentation UI."""

from html.parser import HTMLParser
from pathlib import Path
import re
import tempfile
import threading
import unittest
from pudu_agent.pycon_web import PRESENTATION_UI_ASSETS


ROOT = Path(__file__).resolve().parents[2]
WEB = ROOT / "docs/demos/pycon-2026/web"


class Landmarks(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags = []
        self.ids = set()
        self.labels = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.tags.append(tag)
        if attrs.get("id"):
            self.ids.add(attrs["id"])
        if tag == "label":
            self.labels.append(attrs.get("for"))


class PresentationUiTests(unittest.TestCase):
    def test_fixed_ui_routes_are_exact_and_traversal_is_not_routed(self):
        self.assertEqual(set(PRESENTATION_UI_ASSETS), {"/", "/web/styles.css", "/web/app.js"})
        self.assertEqual(set(PRESENTATION_UI_ASSETS["/"]),
                         {"docs/demos/pycon-2026/web/index.html", "text/html; charset=utf-8"})
        self.assertNotIn("/web/../../etc/passwd", PRESENTATION_UI_ASSETS)
        self.assertNotIn("/web/other.js", PRESENTATION_UI_ASSETS)

    def test_html_has_accessible_presentation_and_run_landmarks(self):
        html = (WEB / "index.html").read_text(encoding="utf-8")
        parser = Landmarks()
        parser.feed(html)
        for landmark in ("header", "nav", "main", "section", "footer", "button", "label"):
            self.assertIn(landmark, parser.tags)
        for element_id in ("report", "run-status", "model-select", "run-button", "findings", "artifacts"):
            self.assertIn(element_id, parser.ids)
        self.assertIn('aria-live="polite"', html)
        self.assertIn('role="alert"', html)
        self.assertIn("skip-link", html)

    def test_presentation_contract_uses_spanish_evidence_and_narrative_labels(self):
        html = (WEB / "index.html").read_text(encoding="utf-8")
        script = (WEB / "app.js").read_text(encoding="utf-8")
        joined = html + script
        for phrase in ("LLMs frente a repositorios gigantes", "búsqueda literal", "AST", "grafo",
                       "evidencia acotada", "modelo local", "verificación", "CONFIRMED", "INFERRED",
                       "UNRESOLVED", "no demuestra el impacto completo en tiempo de ejecución"):
            with self.subTest(phrase=phrase):
                self.assertIn(phrase.casefold(), joined.casefold())
        self.assertIn("/api/presentation/report.json", script)
        self.assertIn("/api/preflight", script)
        self.assertIn("/api/models", script)
        self.assertIn("/api/runs", script)
        self.assertIn("/events", script)
        self.assertIn("factual", joined.lower())

    def test_static_assets_have_no_remote_or_unsafe_rendering_patterns(self):
        html = (WEB / "index.html").read_text(encoding="utf-8")
        script = (WEB / "app.js").read_text(encoding="utf-8")
        css = (WEB / "styles.css").read_text(encoding="utf-8")
        combined = html + script + css
        self.assertNotRegex(combined, r"https?://|//(?:fonts|cdn)\.")
        self.assertNotRegex(html, r"<script\b[^>]*>(?!\s*</script>)")
        self.assertNotRegex(script, r"\beval\s*\(|new\s+Function\s*\(|innerHTML")
        self.assertIn("textContent", script)
        self.assertIn("prefers-reduced-motion", css)
        self.assertIn(":focus-visible", css)
        self.assertRegex(css, r"min-width:\s*320px")


if __name__ == "__main__":
    unittest.main()
