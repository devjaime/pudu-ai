"""Interactive, redacted Ollama analysis for the pinned Transformers evidence."""

import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import stat
import sys
import time
import uuid

from pudu_agent.model_client import ModelInfo, OllamaClient, validate_endpoint
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
DEFAULT_OLLAMA_URL = "http://127.0.0.1:11434"
DEFAULT_OLLAMA_TIMEOUT_SECONDS = 120.0
MAX_OLLAMA_TIMEOUT_SECONDS = 600.0
MAX_EVIDENCE_BYTES = 64 * 1024
MAX_RESPONSE_BYTES = 64 * 1024
ASSET_ROOT = Path(__file__).resolve().parents[2] / "docs/demos/pycon-2026/ollama"
PROJECT_ROOT = Path(__file__).resolve().parents[2]
MANIFEST_RELATIVE = Path(".pudu-ai") / "pycon-demo"


def _canonical_bytes(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")


def _sha256(value):
    return hashlib.sha256(value).hexdigest()


def _validate_timeout(value):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError("Ollama timeout must be a finite number from greater than 0 to 600 seconds")
    try:
        if not 0 < value <= MAX_OLLAMA_TIMEOUT_SECONDS:
            raise ValueError
        return float(value)
    except (OverflowError, ValueError):
        raise ValueError("Ollama timeout must be a finite number from greater than 0 to 600 seconds") from None


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


def _open_manifest_directory():
    if not hasattr(os, "O_NOFOLLOW") or not hasattr(os, "O_DIRECTORY"):
        raise OSError("platform cannot safely enforce manifest path confinement")
    flags = os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW
    current_fd = os.open(PROJECT_ROOT, flags)
    try:
        for component in MANIFEST_RELATIVE.parts:
            try:
                info = os.stat(component, dir_fd=current_fd, follow_symlinks=False)
            except FileNotFoundError:
                try:
                    os.mkdir(component, mode=0o700, dir_fd=current_fd)
                except FileExistsError:
                    pass
                info = os.stat(component, dir_fd=current_fd, follow_symlinks=False)
            if stat.S_ISLNK(info.st_mode) or not stat.S_ISDIR(info.st_mode):
                raise ValueError("manifest path contains a symlink or non-directory component")
            next_fd = os.open(component, flags, dir_fd=current_fd)
            os.close(current_fd)
            current_fd = next_fd
        result_fd = current_fd
        current_fd = -1
        return result_fd
    finally:
        if current_fd != -1:
            os.close(current_fd)


def _write_manifest(directory, manifest):
    expected_directory = PROJECT_ROOT / MANIFEST_RELATIVE
    if Path(directory) != expected_directory:
        raise ValueError("manifest directory is fixed to this project's ignored .pudu-ai/pycon-demo")
    run_id = manifest.get("run_id") if isinstance(manifest, dict) else None
    try:
        if str(uuid.UUID(run_id)) != run_id:
            raise ValueError
    except (ValueError, TypeError, AttributeError):
        raise ValueError("manifest run_id must be a canonical UUID") from None

    directory_fd = _open_manifest_directory()
    destination = f"{run_id}.json"
    temporary = f".{run_id}.json.tmp"
    descriptor = None
    temporary_created = False
    try:
        descriptor = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600,
                             dir_fd=directory_fd)
        temporary_created = True
        with os.fdopen(descriptor, "w", encoding="utf-8") as stream:
            descriptor = None
            json.dump(manifest, stream, ensure_ascii=False, indent=2, sort_keys=True)
            stream.write("\n")
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, destination, src_dir_fd=directory_fd, dst_dir_fd=directory_fd)
        temporary_created = False
    finally:
        if descriptor is not None:
            os.close(descriptor)
        if temporary_created:
            try:
                os.unlink(temporary, dir_fd=directory_fd)
            except FileNotFoundError:
                pass
        os.close(directory_fd)
    return expected_directory / destination


def run_demo(args, *, client_factory=OllamaClient, input_fn=input):
    endpoint = validate_endpoint(args.ollama_url)
    timeout_seconds = _validate_timeout(getattr(args, "ollama_timeout_seconds", DEFAULT_OLLAMA_TIMEOUT_SECONDS))
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
    model_client = client_factory(endpoint, timeout=timeout_seconds)
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
        "ollama_endpoint": endpoint,
        "ollama_timeout_seconds": timeout_seconds,
        "ollama_version": server_version,
        "generation_options": dict(GENERATION_OPTIONS),
        "application_wall_latency_ms": wall_latency_ms,
        "ollama_metrics": metrics,
        "validation": {"status": "structurally_valid", "factual_correctness_checked": False},
        "response": {"sha256": _sha256(response_bytes), "bytes": len(response_bytes)},
    }
    manifest_path = _write_manifest(PROJECT_ROOT / MANIFEST_RELATIVE, manifest)
    return response, manifest_path


def main(argv=None, *, client_factory=OllamaClient, input_fn=input):
    parser = argparse.ArgumentParser(description="Run bounded Transformers evidence analysis using local Ollama.")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--model", help="exact installed model tag required for automatic mode")
    group.add_argument("--interactive", action="store_true", help="select an installed model by number")
    parser.add_argument("--repository", type=Path, default=FIXTURE_ROOT, help="exact pinned Transformers fixture root")
    parser.add_argument("--ollama-url", default=DEFAULT_OLLAMA_URL,
                        help="loopback Ollama endpoint (default: %(default)s)")
    parser.add_argument("--ollama-timeout-seconds", type=float, default=DEFAULT_OLLAMA_TIMEOUT_SECONDS,
                        help="socket-operation timeout in seconds, from >0 to 600 (default: %(default)g); not an end-to-end deadline")
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
