"""Atomic, redacted telemetry for local task executions."""

import json
import math
import os
import re
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


class TelemetryError(RuntimeError):
    pass


METRIC_FIELDS = ("prompt_tokens", "completion_tokens", "total_tokens", "tokens_per_second",
                 "total_duration", "load_duration", "eval_duration")
STEP_NAMES = {"analyze", "context", "route", "execute", "verify", "telemetry"}
STEP_STATUSES = {"completed", "failed"}
_MODEL_NAME = re.compile(r"[A-Za-z0-9._:/-]{1,128}\Z")


def _metric_value(value: Any) -> int | float | None:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    if not math.isfinite(value) or value < 0:
        return None
    return value


def _steps(value: Any) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        return []
    safe = []
    for item in value:
        if not isinstance(item, dict):
            continue
        name, status, duration = item.get("name"), item.get("status"), item.get("duration_ms")
        if (isinstance(name, str) and name in STEP_NAMES and isinstance(status, str) and status in STEP_STATUSES and
                isinstance(duration, int) and not isinstance(duration, bool) and duration >= 0):
            safe.append({"name": name, "status": status, "duration_ms": duration})
    return safe


def _verification(value: Any) -> dict[str, Any] | None:
    if not isinstance(value, dict) or not isinstance(value.get("status"), str) or value["status"] not in {"passed", "failed"}:
        return None
    return {"level": "STRUCTURAL", "status": value["status"], "factual_correctness_checked": False}


def _safe_destination(repository: str | Path, task_id: str) -> tuple[Path, Path]:
    if not isinstance(task_id, str) or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{0,127}", task_id):
        raise TelemetryError("task id is not a safe filename")
    root = Path(repository).expanduser().resolve(strict=True)
    if not root.is_dir():
        raise TelemetryError("repository root is not a directory")
    base = root / ".pudu-ai"
    directory = base / "task-telemetry"
    for path in (base, directory):
        if path.is_symlink():
            raise TelemetryError("telemetry path must not contain symlinks")
    directory.mkdir(parents=True, exist_ok=True)
    resolved = directory.resolve(strict=True)
    if not resolved.is_relative_to(root):
        raise TelemetryError("telemetry path escapes repository")
    destination = resolved / f"{task_id}.json"
    if destination.is_symlink() or not destination.resolve(strict=False).is_relative_to(root):
        raise TelemetryError("telemetry destination escapes repository")
    return resolved, destination


def write_run(repository: str | Path, task_id: str, run: dict[str, Any]) -> Path:
    directory, destination = _safe_destination(repository, task_id)
    metrics_in = run.get("metrics") if isinstance(run.get("metrics"), dict) else {}
    payload = {
        "schemaVersion": 1,
        "taskId": task_id,
        "status": run.get("status") if isinstance(run.get("status"), str) and run["status"] in {"success", "failed"} else "failed",
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "effort": run.get("effort") if isinstance(run.get("effort"), str) and run["effort"] in {"LOW", "MEDIUM", "HIGH", "VERY_HIGH"} else None,
        "model": run.get("model") if isinstance(run.get("model"), str) and _MODEL_NAME.fullmatch(run["model"]) else None,
        "modelOrigin": "DERIVED",
        "verification": _verification(run.get("verification")),
        "verificationLevel": "STRUCTURAL",
        "failureCode": run.get("failure_code") if isinstance(run.get("failure_code"), str) and re.fullmatch(r"[a-z0-9_]{1,80}", run["failure_code"]) else None,
        "steps": _steps(run.get("steps")),
        "metrics": {field: _metric_value(metrics_in.get(field)) for field in METRIC_FIELDS},
        "metricsOrigin": "MEASURED",
        "derivedMetricsOrigin": "DERIVED",
    }
    fd, temp_name = tempfile.mkstemp(prefix=f".{task_id}.", suffix=".tmp", dir=directory)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as stream:
            json.dump(payload, stream, ensure_ascii=False, separators=(",", ":"))
            stream.write("\n")
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temp_name, destination)
    except OSError as exc:
        try:
            os.unlink(temp_name)
        except OSError:
            pass
        raise TelemetryError("could not atomically write task telemetry") from exc
    return destination
