"""Deterministic, bounded source evidence for the pinned Transformers demo."""

import ast
import subprocess
from pathlib import Path

EXPECTED_COMMIT = "18329f1065382e54db698e242cf98bd3f3e5a766"
EXPECTED_TAG = "v5.20.2"
MAX_FILES = 600
MAX_RESULTS_PER_KIND = 8


def _git(root, *args):
    result = subprocess.run(["git", "-C", str(root), *args], capture_output=True, text=True, check=True)
    return result.stdout.strip()


def _location(root, path, node, symbol, relationship, label="CONFIRMED"):
    return {
        "symbol": symbol,
        "path": path.relative_to(root).as_posix(),
        "line_start": getattr(node, "lineno", 1),
        "line_end": getattr(node, "end_lineno", getattr(node, "lineno", 1)),
        "relationship": relationship,
        "label": label,
    }


def _python_files(root, directory):
    base = root / directory
    if not base.is_dir():
        return []
    return sorted(base.rglob("*.py"), key=lambda path: path.relative_to(root).as_posix())[:MAX_FILES]


def _parse(path):
    try:
        return ast.parse(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, SyntaxError):
        return None


def collect_evidence(root):
    """Collect source-level candidate impact; this is not complete runtime proof."""
    root = Path(root).resolve()
    repository_root = Path(_git(root, "rev-parse", "--show-toplevel")).resolve()
    if repository_root != root:
        raise ValueError(f"Expected repository root {repository_root}, got {root}; subdirectories are not accepted")
    actual_revision = _git(root, "rev-parse", "HEAD")
    if actual_revision != EXPECTED_COMMIT:
        raise ValueError(f"Expected Transformers commit {EXPECTED_COMMIT}, got {actual_revision}")
    tag = _git(root, "describe", "--tags", "--exact-match", "HEAD")
    if tag != EXPECTED_TAG:
        raise ValueError(f"Expected Transformers tag {EXPECTED_TAG}, got {tag}")

    definition = []
    caller = []
    inheritance = []
    configuration = []
    tests = []
    paths = {
        "generation": "src/transformers/generation/utils.py",
        "pipeline": "src/transformers/pipelines/text_generation.py",
        "configuration": "src/transformers/generation/configuration_utils.py",
    }
    for name, path_text in paths.items():
        path = root / path_text
        tree = _parse(path) if path.is_file() else None
        if tree is None:
            continue
        for node in ast.walk(tree):
            if name == "generation" and isinstance(node, ast.ClassDef) and node.name == "GenerationMixin":
                definition.append(_location(root, path, node, node.name, "defines generation mixin"))
            if name == "generation" and isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name == "generate":
                definition.append(_location(root, path, node, node.name, "defines generate method"))
            if name == "pipeline" and isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                for child in ast.walk(node):
                    if isinstance(child, ast.Call) and isinstance(child.func, ast.Attribute) and child.func.attr == "generate":
                        caller.append(_location(root, path, child, f"{node.name} -> generate", "calls generate on model"))
            if name == "configuration" and isinstance(node, ast.ClassDef) and node.name == "GenerationConfig":
                configuration.append(_location(root, path, node, node.name, "defines the public generation configuration contract"))

    if not any(item["symbol"] == "GenerationMixin" for item in definition) or not any(item["symbol"] == "generate" for item in definition) or not caller:
        raise ValueError("Checkout is missing required evidence for GenerationMixin.generate or its TextGenerationPipeline caller")

    for directory in ("src/transformers/models",):
        for path in _python_files(root, directory):
            tree = _parse(path)
            if tree is None:
                continue
            for node in ast.walk(tree):
                if isinstance(node, ast.ClassDef) and any("GenerationMixin" in ast.unparse(base) for base in node.bases):
                    inheritance.append(_location(root, path, node, node.name, "inherits from GenerationMixin"))
                    if len(inheritance) >= MAX_RESULTS_PER_KIND:
                        break
            if len(inheritance) >= MAX_RESULTS_PER_KIND:
                break

    for path in _python_files(root, "tests"):
        tree = _parse(path)
        if tree is None:
            continue
        found = False
        for node in ast.walk(tree):
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute) and node.func.attr == "generate":
                tests.append(_location(root, path, node, "generate", "test invokes generate"))
                found = True
                if len(tests) >= MAX_RESULTS_PER_KIND:
                    break
        if found and len(tests) >= MAX_RESULTS_PER_KIND:
            break

    unresolved = [
        "AST evidence does not resolve dynamic dispatch, registries, generated mappings, native extensions, or all runtime paths.",
        "The bounded test scan returns at most eight lexical generate() call sites; it does not execute tests or prove assertions.",
        "Model inheritance and pipeline calls are candidate impact, not proof that a specific runtime uses these paths.",
    ]
    return {
        "schema": "pudu.transformers-evidence/v1",
        "repository": {"name": "huggingface/transformers", "tag": tag, "revision": actual_revision},
        "target": "GenerationMixin.generate",
        "commands": [
            "git rev-parse HEAD",
            "git describe --tags --exact-match HEAD",
            "AST scan src/transformers/generation/utils.py for GenerationMixin and generate",
            "AST scan src/transformers/pipelines/text_generation.py for generate calls",
            "AST scan sorted src/transformers/models/**/*.py for GenerationMixin inheritance (max 600 files, 8 results)",
            "AST scan sorted tests/**/*.py for generate calls (max 600 files, 8 results)",
        ],
        "queries": ["class GenerationMixin", "def generate", "TextGenerationPipeline model.generate", "GenerationMixin inheritance", "GenerationConfig", "tests calling generate"],
        "evidence": {
            "definition": definition[:MAX_RESULTS_PER_KIND],
            "pipeline_caller": caller[:MAX_RESULTS_PER_KIND],
            "model_inheritance": inheritance,
            "configuration": configuration[:MAX_RESULTS_PER_KIND],
            "tests": tests,
        },
        "interpretation": [
            {"label": "INFERRED", "relationship": "source-level inheritance and calls indicate candidate impact only"},
            {"label": "UNRESOLVED", "relationship": "dynamic/runtime impact is not established by this static scan"},
        ],
        "limitations": unresolved,
    }


def main(argv=None):
    import argparse
    import json

    parser = argparse.ArgumentParser(description="Capture deterministic Transformers source evidence.")
    parser.add_argument("repository", type=Path, help="Path to the pinned Transformers checkout")
    args = parser.parse_args(argv)
    try:
        evidence = collect_evidence(args.repository)
    except (OSError, subprocess.CalledProcessError, ValueError) as exc:
        parser.error(str(exc))
    print(json.dumps(evidence, ensure_ascii=False, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
