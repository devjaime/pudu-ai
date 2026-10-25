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
        self.assertEqual(set(PRESENTATION_UI_ASSETS), {"/", "/web/styles.css", "/web/app.js", "/web/run-state.mjs"})
        self.assertEqual(set(PRESENTATION_UI_ASSETS["/"]),
                         {"docs/demos/pycon-2026/web/index.html", "text/html; charset=utf-8"})
        self.assertNotIn("/web/../../etc/passwd", PRESENTATION_UI_ASSETS)
        self.assertNotIn("/web/other.js", PRESENTATION_UI_ASSETS)

    def test_stage_status_is_not_rendered_as_evidence_or_marked_confirmed(self):
        script = (WEB / "app.js").read_text(encoding="utf-8")
        self.assertIn("presentStage(stage)", script)
        self.assertIn("${stageView.label} · ${stageView.status}", script)
        self.assertNotIn('"status confirmed", stage.status', script)

    def test_pending_poll_keeps_run_and_resume_action(self):
        script = (WEB / "app.js").read_text(encoding="utf-8")
        self.assertRegex(script, r"if \(outcome\.kind === \"pending\"\) \{[\s\S]*?return;\s*\}\s*activeRunId = null;")
        self.assertIn('resumeButton.addEventListener("click", () => pollActiveRun(activeRunId))', script)
        self.assertIn("Boolean(activeRunId)", script)

    def test_html_has_accessible_presentation_and_run_landmarks(self):
        html = (WEB / "index.html").read_text(encoding="utf-8")
        parser = Landmarks()
        parser.feed(html)
        for landmark in ("header", "nav", "main", "section", "footer", "button", "label"):
            self.assertIn(landmark, parser.tags)
        for element_id in ("report", "run-status", "model-select", "run-button", "findings", "artifacts"):
            self.assertIn(element_id, parser.ids)
        self.assertIn("resume-run", parser.ids)
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

    def test_value_precedes_method_and_names_decision_outcome(self):
        html = (WEB / "index.html").read_text(encoding="utf-8")
        visible_text = re.sub(r"<[^>]+>", " ", html)
        visible_text = re.sub(r"\s+", " ", visible_text).casefold()
        self.assertLess(html.index("id=\"impacto\""), html.index("id=\"metodo\""))
        for phrase in ("¿Qué puede romper este cambio?", "antes de aprobar", "3.682", "816.502",
                       "8 candidatos", "600+", "no estaba respaldada", "impacto completo en tiempo de ejecución sigue sin demostrarse"):
            with self.subTest(phrase=phrase):
                self.assertIn(phrase.casefold(), visible_text)
        self.assertIn("href=\"#impacto\"", html)

    def test_repository_context_precedes_method_and_explains_python_stack(self):
        html = (WEB / "index.html").read_text(encoding="utf-8")
        visible_text = re.sub(r"<[^>]+>", " ", html)
        visible_text = re.sub(r"\s+", " ", visible_text).casefold()
        self.assertLess(html.index("id=\"impacto\""), html.index("id=\"repositorio\""))
        self.assertLess(html.index("id=\"repositorio\""), html.index("id=\"metodo\""))
        for phrase in ("framework de definición de modelos", "2.764 archivos python",
                       "1.709 archivos python de pruebas", "531 directorios de modelos",
                       "python 3.10+", "pytorch 2.6+", "huggingface-hub", "tokenizers",
                       "safetensors", "http.server", "ast", "repositorios python grandes"):
            with self.subTest(phrase=phrase):
                self.assertIn(phrase.casefold(), visible_text)
        self.assertIn("href=\"#repositorio\"", html)

    def test_mobile_report_grid_can_shrink_without_horizontal_overflow(self):
        css = (WEB / "styles.css").read_text(encoding="utf-8")
        self.assertIn(".report-grid{grid-template-columns:minmax(0,1fr)}", css)
        self.assertIn(".claim,.notice{overflow-wrap:anywhere}", css)

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
