"""Deterministic effort analysis and local-model routing."""

from dataclasses import dataclass
from enum import Enum
import re
from typing import Any, Iterable

from pudu_agent.task import Task, TaskKind


class Effort(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    VERY_HIGH = "VERY_HIGH"


@dataclass(frozen=True)
class EffortAnalysis:
    effort: Effort
    reason: str
    origin: str = "DERIVED"


@dataclass(frozen=True)
class ModelRoute:
    model: str
    reason: str
    origin: str = "DERIVED"


_KIND_EFFORT = {
    TaskKind.SUMMARY: Effort.LOW,
    TaskKind.DOCUMENTATION: Effort.LOW,
    TaskKind.ANALYSIS: Effort.MEDIUM,
    TaskKind.CODE_REVIEW: Effort.HIGH,
    TaskKind.TEST_GENERATION: Effort.HIGH,
}
_EFFORTS = list(Effort)


def analyze_effort(task: Task, repository_metrics: dict[str, Any] | None = None) -> EffortAnalysis:
    if task.effort is not None:
        try:
            effort = Effort(task.effort.upper())
        except (AttributeError, ValueError):
            raise ValueError("effort must be LOW, MEDIUM, HIGH, or VERY_HIGH") from None
        return EffortAnalysis(effort, "explicit task effort")
    effort = _KIND_EFFORT[task.kind]
    reason = f"task kind {task.kind.value} maps to {effort.value} baseline"
    metrics = repository_metrics or {}
    file_count = metrics.get("file_count")
    total_bytes = metrics.get("total_bytes")
    large = (isinstance(file_count, int) and not isinstance(file_count, bool) and file_count >= 1000) or (
        isinstance(total_bytes, int) and not isinstance(total_bytes, bool) and total_bytes >= 100_000_000
    )
    if large and effort != Effort.VERY_HIGH:
        effort = _EFFORTS[_EFFORTS.index(effort) + 1]
        reason += "; measured repository size raises the effort tier"
    return EffortAnalysis(effort, reason)


def route_model(task: Task, client: Any, *, history: Iterable[dict[str, Any]] | None = None) -> ModelRoute:
    models = client.list_models()
    eligible = sorted(model for model in models if isinstance(model, str) and model and not _is_cloud_tag(model))
    if task.model is not None:
        if task.model not in eligible:
            raise ValueError("explicit model is not installed and eligible locally")
        return ModelRoute(task.model, "explicit model is installed locally")
    if not eligible:
        raise ValueError("no eligible local Ollama models are installed")

    counts: dict[str, int] = {}
    for entry in history or ():
        if not isinstance(entry, dict) or entry.get("status") != "success":
            continue
        verification = entry.get("verification")
        if not isinstance(verification, dict) or verification.get("status") != "passed":
            continue
        model = entry.get("model")
        if model in eligible:
            counts[model] = counts.get(model, 0) + 1
    if counts:
        model = min(counts, key=lambda name: (-counts[name], name))
        return ModelRoute(model, "selected from prior structurally verified local runs; this is not factual quality evidence")
    return ModelRoute(eligible[0], "no quality evidence exists; selected first eligible model by stable name order")


def _is_cloud_tag(model: str) -> bool:
    return re.search(r"(?::cloud|-cloud)$", model, re.IGNORECASE) is not None
