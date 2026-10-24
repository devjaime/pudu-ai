"""Build stable JSON and Markdown reports from bounded Transformers evidence."""

import argparse
import json
from pathlib import Path

from pudu_agent.transformers_evidence import collect_evidence

REPORT_SCHEMA = "pudu.transformers-demo-report/v1"
ARTIFACT_DIR = Path("docs/demos/pycon-2026/evidence")


def _locations(evidence, category):
    return evidence.get("evidence", {}).get(category, [])


def _context_measurement(evidence, source_root):
    root = Path(source_root).resolve()
    paths = sorted({item["path"] for values in evidence.get("evidence", {}).values() for item in values})
    source_bytes = 0
    for relative in paths:
        path = (root / relative).resolve()
        if not path.is_relative_to(root):
            raise ValueError(f"Evidence path escapes repository: {relative}")
        source_bytes += path.stat().st_size
    compact_evidence = json.dumps(evidence.get("evidence", {}), ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    reduction = round((1 - len(compact_evidence) / source_bytes) * 100, 2) if source_bytes else 0.0
    return {
        "measurement": "metadata bytes compared with full cited source-file bytes",
        "cited_source_files": len(paths),
        "cited_source_file_bytes": source_bytes,
        "evidence_metadata_bytes": len(compact_evidence),
        "byte_reduction_percent": reduction,
        "interpretation": "A deterministic byte-size comparison only; metadata is not semantically equivalent to source code and bytes are not tokens.",
    }


def _claim(claim_id, title, status, summary, categories, evidence, qualification=None):
    locations = []
    for category in categories:
        for item in _locations(evidence, category):
            locations.append({
                "path": item["path"],
                "line_start": item["line_start"],
                "line_end": item["line_end"],
                "relationship": item["relationship"],
                "label": item["label"],
            })
    return {"id": claim_id, "title": title, "status": status, "summary": summary, "sources": locations, "qualification": qualification}


def build_report(evidence, source_root):
    """Build report data from one collector result without rerunning evidence scans."""
    repo = evidence["repository"]
    groups = evidence.get("evidence", {})
    if not any(item.get("symbol") == "GenerationMixin" for item in groups.get("definition", [])) or not any(item.get("symbol") == "generate" for item in groups.get("definition", [])) or not groups.get("pipeline_caller"):
        raise ValueError("Report requires GenerationMixin.generate definition and pipeline caller evidence")
    claims = [
        _claim("definition", "GenerationMixin.generate definition", "CONFIRMED", "The pinned source defines GenerationMixin and its generate method.", ("definition",), evidence),
        _claim("pipeline", "Text-generation pipeline caller", "CONFIRMED", "The text-generation pipeline contains a lexical call to model.generate.", ("pipeline_caller",), evidence),
        _claim("inheritance", "Model inheritance candidates", "INFERRED", f"The bounded AST scan found {len(groups.get('model_inheritance', []))} model classes declaring GenerationMixin inheritance; runtime participation is not established.", ("model_inheritance",), evidence),
        _claim("configuration", "Generation configuration contract", "CONFIRMED", "The public GenerationConfig declaration is present in the pinned source.", ("configuration",), evidence),
        _claim("tests", "Test source references", "CONFIRMED", f"The bounded AST scan found {len(groups.get('tests', []))} lexical generate() test call sites; tests were not executed by this collector.", ("tests",), evidence),
        {"id": "runtime-impact", "title": "Complete runtime impact", "status": "UNRESOLVED", "summary": "Static source evidence cannot prove complete runtime impact or dynamic dispatch.", "sources": [], "qualification": "Candidate impact only."},
    ]
    return {
        "schema": REPORT_SCHEMA,
        "investigation": {"question": "What code is a candidate impact surface if GenerationMixin.generate changes?", "target": evidence["target"]},
        "repository": {"name": repo["name"], "tag": repo["tag"], "revision": repo["revision"]},
        "stages": [
            {"name": "FIXTURE_IDENTITY", "status": "VERIFIED", "detail": "Collector validated the exact Git checkout root, commit, and tag."},
            {"name": "BOUNDED_PYTHON_AST_EVIDENCE", "status": "COMPLETED", "detail": "Collector inspected configured source paths and bounded sorted model/test Python file sets."},
            {"name": "REPORT_AND_CONTEXT_MEASUREMENT", "status": "COMPLETED", "detail": "Report generated from the in-memory evidence object; byte measurement covers cited files only."},
            {"name": "RUNTIME_TESTS", "status": "NOT_RUN", "detail": "This report command does not execute Transformers tests or model code."},
            {"name": "MODEL_ANALYSIS", "status": "NOT_RUN", "detail": "No model call was performed for this artifact."},
        ],
        "context_reduction": _context_measurement(evidence, source_root),
        "claims": claims,
        "collector_commands": evidence.get("commands", []),
        "queries": evidence.get("queries", []),
        "limitations": list(evidence.get("limitations", [])) + [
            "Evidence is a bounded source-level candidate-impact set, not a complete dependency graph or runtime proof.",
            "Context reduction is a file-byte comparison of metadata against full cited source files, not a token or semantic-equivalence measurement.",
            "Model analysis is NOT_RUN; no model inference or weights were used.",
        ],
    }


def render_markdown(report):
    """Render the human-readable report exclusively from report JSON data."""
    repo = report["repository"]
    investigation = report["investigation"]
    metric = report["context_reduction"]
    lines = [
        "# Transformers impact evidence",
        "",
        f"**Question:** {investigation['question']}",
        f"**Target:** `{investigation['target']}`",
        "",
        "## Pinned repository",
        "",
        f"- Repository: `{repo['name']}`",
        f"- Tag: `{repo['tag']}`",
        f"- Commit: `{repo['revision']}`",
        "",
        "## Investigation stages",
        "",
        "| Stage | Status | Detail |",
        "|---|---|---|",
    ]
    lines.extend(f"| `{stage['name']}` | **{stage['status']}** | {stage['detail']} |" for stage in report["stages"])
    lines.extend([
        "",
        "## Context-size measurement",
        "",
        f"Compared metadata size: **{metric['evidence_metadata_bytes']:,} bytes**; full cited source files: **{metric['cited_source_file_bytes']:,} bytes** across {metric['cited_source_files']} files.",
        f"Deterministic byte reduction: **{metric['byte_reduction_percent']:.2f}%**.",
        f"_{metric['interpretation']}_",
        "",
        "## Claims and source evidence",
        "",
    ])
    for claim in report["claims"]:
        lines.extend([f"### {claim['status']} — {claim['title']}", "", claim["summary"], ""])
        for source in claim["sources"]:
            lines.append(f"- `{source['path']}#L{source['line_start']}-L{source['line_end']}` — {source['relationship']} (**{source['label']}**).")
        if claim["qualification"]:
            lines.append(f"- Qualification: {claim['qualification']}")
        lines.append("")
    lines.extend(["## Limitations", ""])
    lines.extend(f"- {item}" for item in report["limitations"])
    lines.append("")
    return "\n".join(lines)


def write_report(evidence, source_root, output_dir):
    """Write JSON and Markdown projections from a single report object."""
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    report = build_report(evidence, source_root)
    json_path = output_dir / "report.json"
    markdown_path = output_dir / "report.md"
    json_path.write_text(json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    markdown_path.write_text(render_markdown(report), encoding="utf-8")
    return json_path, markdown_path


def main(argv=None):
    parser = argparse.ArgumentParser(description="Generate deterministic Transformers evidence JSON and Markdown.")
    parser.add_argument("repository", type=Path, help="Pinned Transformers checkout root")
    parser.add_argument("--output-dir", type=Path, default=ARTIFACT_DIR, help="Artifact output directory")
    args = parser.parse_args(argv)
    evidence = collect_evidence(args.repository)
    json_path, markdown_path = write_report(evidence, args.repository, args.output_dir)
    print(f"Wrote {json_path} and {markdown_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
