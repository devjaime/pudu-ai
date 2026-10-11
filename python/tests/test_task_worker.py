import sys
import tempfile
from unittest import mock
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from pudu_agent.task import Task
from pudu_agent.worker import MAX_FINAL_PROMPT_BYTES, ContextError, build_context

class ContextTests(unittest.TestCase):
    def test_context_is_bounded_and_excludes_sensitive_or_disallowed_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "README.md").write_text("summary " + "r" * 100, encoding="utf-8")
            (root / "src.py").write_text("def summarize(): return True", encoding="utf-8")
            (root / ".env").write_text("SECRET=not-for-context", encoding="utf-8")
            (root / "notes.bin").write_bytes(b"x")
            result = build_context(Task.from_dict({"kind": "summary", "prompt": "summarize"}), root,
                                  max_files=2, per_file_bytes=40, max_total_bytes=70)
            self.assertLessEqual(len(result.files), 2)
            self.assertLessEqual(result.bytes_read, 70)
            self.assertNotIn("SECRET", result.prompt)
            self.assertNotIn("not-for-context", result.prompt)
            self.assertNotIn("notes.bin", result.files)

    def test_context_prompt_and_deadline_are_bounded(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "notes.md").write_text("content", encoding="utf-8")
            task = Task.from_dict({"kind": "analysis", "prompt": "p" * 1000})
            result = build_context(task, root, max_prompt_bytes=50)
            self.assertTrue(result.truncated)
            self.assertLessEqual(len(result.prompt.encode("utf-8")), 300)
            with mock.patch("pudu_agent.worker.time.monotonic", side_effect=[0.0, 2.0]):
                expired = build_context(Task.from_dict({"kind": "analysis", "prompt": "inspect"}), root,
                                        candidate_paths=["notes.md"], timeout_s=1)
            self.assertEqual(expired.files, [])
            self.assertTrue(expired.truncated)

    def test_context_limits_cannot_be_raised_above_hard_caps(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(ValueError):
                build_context(Task.from_dict({"kind": "analysis", "prompt": "inspect"}), Path(tmp), max_total_bytes=1_000_000)

    def test_explicit_paths_cannot_bypass_sensitive_or_skip_directories(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            paths = [".git/config.py", ".pudu-ai/private.py", "node_modules/pkg/index.js",
                     ".venv/lib/site.py", "secrets/source.py", "src/safe.py"]
            for name in paths:
                path = root / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text("safe-visible" if name == "src/safe.py" else "classified", encoding="utf-8")
            result = build_context(Task.from_dict({"kind": "analysis", "prompt": "inspect"}), root,
                                   candidate_paths=paths)
            self.assertEqual(result.files, ["src/safe.py"])
            self.assertNotIn("classified", result.prompt)

    def test_final_utf8_prompt_including_headers_has_a_hard_byte_cap(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            names = []
            for index in range(4):
                name = f"source{index}.md"
                (root / name).write_text("界" * 30_000, encoding="utf-8")
                names.append(name)
            result = build_context(Task.from_dict({"kind": "analysis", "prompt": "p" * 16_000}), root,
                                   candidate_paths=names, max_files=4, max_results=4, max_prompt_bytes=16_000,
                                   per_file_bytes=64_000, max_total_bytes=256_000)
            self.assertLessEqual(len(result.prompt.encode("utf-8")), MAX_FINAL_PROMPT_BYTES)
            self.assertTrue(result.truncated)

    def test_context_rejects_path_escape_and_symlinks(self):
        with tempfile.TemporaryDirectory() as tmp, tempfile.TemporaryDirectory() as outside:
            root, other = Path(tmp), Path(outside)
            (other / "escape.py").write_text("private", encoding="utf-8")
            with self.assertRaises(ContextError):
                build_context(Task.from_dict({"kind": "analysis", "prompt": "inspect"}), root,
                              candidate_paths=[other / "escape.py"])
            link = root / "link.py"
            link.symlink_to(other / "escape.py")
            with self.assertRaises(ContextError):
                build_context(Task.from_dict({"kind": "analysis", "prompt": "inspect"}), root,
                              candidate_paths=[link])

    def test_context_rejects_symlinked_parent(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            actual = root / "actual"
            actual.mkdir()
            (actual / "source.py").write_text("source", encoding="utf-8")
            (root / "alias").symlink_to(actual, target_is_directory=True)
            with self.assertRaises(ContextError):
                build_context(Task.from_dict({"kind": "analysis", "prompt": "inspect"}), root,
                              candidate_paths=["alias/source.py"])
