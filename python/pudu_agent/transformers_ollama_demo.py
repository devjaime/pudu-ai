"""Interactive, redacted Ollama analysis for the pinned Transformers evidence."""

import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import sys
import time
import uuid

from pudu_agent.model_client import ModelInfo, OllamaClient
from pudu_agent.transformers_evidence import collect_evidence


FIXTURE = {
    "name": "huggingface/transformers",
    "tag": "v5.20.2",
    "revision": "18329f1065382e54db698e242cf98bd3f3e5a766",
}
FIXTURE_ROOT = Path("/Volumes/KINGSTON/pudu-pycon-2026/transformers")
PROMPT_VERSION = "prompt-v1"
SCHEMA_VERSION = "pudu.transformers-ollama-analysis/v1"
GENERATION_OPTIONS = {"temperature": 0, "seed": 20260520}
MAX_EVIDENCE_BYTES = 64 * 1024
MAX_RESPONSE_BYTES = 64 * 1024
ASSET_ROOT = Path(__file__).resolve().parents[2] / "docs/demos/pycon-2026/ollama"


def _canonical_bytes(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")


def _sha256(value):
    return hashlib.sha256(value).hexdigest()


def _validate_fixture(evidence):
    repository = evidence.get("repository") if isinstance(evidence, dict) else None
    expected = {"name": FIXTURE["name"], "tag": FIXTURE["tag"], "revision": FIXTURE["revision"]}
    if repository != expected:
        raise ValueError("fixture identity mismatch; expected the pinned Transformers repository, tag, and commit")


def _eligible_models(models):
    eligible = [model for model in models if isinstance(model, ModelInfo) and model.tag and model.digest]
    return sorted(eligible, key=lambda model: model.tag)


def _choose_model(client, args, input_fn=input):
    if not args.model and not args.interactive:
        raise ValueError("automatic mode requires --model with an exact installed model tag")
    models = _eligible_models(client.list_model_details())
    if args.model:
        selected = next((model for model in models if model.tag == args.model), None)
        if selected is None:
            raise ValueError("requested model is not installed with a verifiable digest")
        return selected
    if not models:
        raise ValueError("no installed local models with a digest are eligible")
    print("Modelos locales disponibles:")
    for index, model in enumerate(models, 1):
        print(f"{index}) {model.tag} — {model.digest}")
    choice = input_fn("Seleccione un número (o q para cancelar): ").strip()
    if choice.lower() in {"q", "cancel", "cancelar"}:
        raise ValueError("selección cancelada")
    if not choice.isdecimal() or not 1 <= int(choice) <= len(models):
        raise ValueError("selección inválida; use uno de los números mostrados")
    return models[int(choice) - 1]


def _validate_response(text, schema):
    if not isinstance(text, str) or len(text.encode("utf-8")) > MAX_RESPONSE_BYTES:
        raise ValueError("model response is empty or exceeds the response size limit")
    try:
        value = json.loads(text)
    except (json.JSONDecodeError, UnicodeError):
        raise ValueError("model response is not valid JSON") from None
    if not isinstance(value, dict) or set(value) != {"schema", "summary", "findings"}:
        raise ValueError("model response does not match the versioned JSON contract")
    if value["schema"] != SCHEMA_VERSION or not isinstance(value["summary"], str) or not 1 <= len(value["summary"]) <= 1000:
        raise ValueError("model response does not match the versioned JSON contract")
    findings = value["findings"]
    if not isinstance(findings, list) or len(findings) > 12:
        raise ValueError("model response does not match the versioned JSON contract")
    for finding in findings:
        if (not isinstance(finding, dict) or set(finding) != {"label", "claim", "rationale", "evidence_refs"}
                or finding["label"] not in {"INFERRED", "UNRESOLVED"}
                or not isinstance(finding["claim"], str) or not 1 <= len(finding["claim"]) <= 500
                or not isinstance(finding["rationale"], str) or not 1 <= len(finding["rationale"]) <= 1000
                or not isinstance(finding["evidence_refs"], list) or len(finding["evidence_refs"]) > 8
                or any(not isinstance(ref, str) or len(ref) > 240 for ref in finding["evidence_refs"])):
            raise ValueError("model response does not match the versioned JSON contract")
    if schema.get("$id") != SCHEMA_VERSION:
        raise ValueError("bundled response schema has an unexpected version")
    return value


def _observed_metrics(result):
    """Keep only counters and durations exposed by the Ollama response contract."""
    fields = ("prompt_tokens", "completion_tokens", "total_duration", "load_duration", "eval_duration")
    return {field: getattr(result, field) for field in fields if getattr(result, field) is not None}


def _write_manifest(directory, manifest):
    directory.mkdir(parents=True, exist_ok=True)
    destination = directory / f"{manifest['run_id']}.json"
    temporary = destination.with_suffix(".json.tmp")
    try:
        with temporary.open("x", encoding="utf-8") as stream:
            json.dump(manifest, stream, ensure_ascii=False, indent=2, sort_keys=True)
            stream.write("\n")
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, destination)
    finally:
        if temporary.exists():
            temporary.unlink()
    return destination


def run_demo(args, *, client_factory=OllamaClient, input_fn=input):
    if Path(args.repository).resolve() != FIXTURE_ROOT.resolve():
        raise ValueError(f"fixture root must be exactly {FIXTURE_ROOT}")
    evidence = collect_evidence(args.repository)
    _validate_fixture(evidence)
    evidence_bytes = _canonical_bytes(evidence)
    if len(evidence_bytes) > MAX_EVIDENCE_BYTES:
        raise ValueError("deterministic evidence exceeds the configured size limit")
    prompt_path = ASSET_ROOT / "prompt-v1.txt"
    schema_path = ASSET_ROOT / "response-schema-v1.json"
    prompt_bytes = prompt_path.read_bytes()
    schema_bytes = schema_path.read_bytes()
    prompt = prompt_bytes.decode("utf-8")
    schema = json.loads(schema_bytes)
    model_client = client_factory()
    model = _choose_model(model_client, args, input_fn)
    server_version = model_client.server_version()
    started = time.monotonic()
    result = model_client.generate(model.tag, prompt + "\n\nVERSIONED JSON RESPONSE CONTRACT:\n"
                                  + schema_bytes.decode("utf-8") + "\n\nBOUNDED DETERMINISTIC EVIDENCE:\n"
                                  + evidence_bytes.decode("utf-8"),
                                  format="json", options=dict(GENERATION_OPTIONS))
    wall_latency_ms = max(0, int((time.monotonic() - started) * 1000))
    if result.model != model.tag:
        raise ValueError("Ollama response model identity does not match the selected exact tag")
    response_bytes = result.content.encode("utf-8")
    response = _validate_response(result.content, schema)
    metrics = _observed_metrics(result)
    manifest = {
        "schema": "pudu.transformers-ollama-manifest/v1",
        "run_id": str(uuid.uuid4()),
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "fixture": FIXTURE,
        "evidence": {"sha256": _sha256(evidence_bytes), "bytes": len(evidence_bytes)},
        "prompt": {"version": PROMPT_VERSION, "sha256": _sha256(prompt_bytes), "bytes": len(prompt_bytes)},
        "response_schema": {"version": SCHEMA_VERSION, "sha256": _sha256(schema_bytes), "bytes": len(schema_bytes)},
        "model": {"tag": model.tag, "digest": model.digest},
        "ollama_version": server_version,
        "generation_options": dict(GENERATION_OPTIONS),
        "application_wall_latency_ms": wall_latency_ms,
        "ollama_metrics": metrics,
        "validation": {"status": "structurally_valid", "factual_correctness_checked": False},
        "response": {"sha256": _sha256(response_bytes), "bytes": len(response_bytes)},
    }
    manifest_path = _write_manifest(args.manifest_dir, manifest)
    return response, manifest_path


def main(argv=None, *, client_factory=OllamaClient, input_fn=input):
    parser = argparse.ArgumentParser(description="Run bounded Transformers evidence analysis using local Ollama.")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--model", help="exact installed model tag required for automatic mode")
    group.add_argument("--interactive", action="store_true", help="select an installed model by number")
    parser.add_argument("--repository", type=Path, default=FIXTURE_ROOT, help="exact pinned Transformers fixture root")
    parser.add_argument("--manifest-dir", type=Path, default=Path(".pudu-ai/pycon-demo"), help="redacted manifest directory")
    args = parser.parse_args(argv)
    try:
        response, manifest_path = run_demo(args, client_factory=client_factory, input_fn=input_fn)
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 2
    print("\nAnálisis de Ollama (interpretación del modelo; requiere validación independiente):")
    print(json.dumps(response, ensure_ascii=False, indent=2, sort_keys=True))
    print(f"Manifiesto redactado: {manifest_path}")
    print("La validez estructural del JSON no demuestra corrección factual.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
