"""Small linear local-task orchestration with redacted step evidence."""

import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Callable

from pudu_agent.model_client import GenerateResult, OllamaClient
from pudu_agent.router import EffortAnalysis, ModelRoute, analyze_effort, route_model
from pudu_agent.task import Task
from pudu_agent.telemetry import write_run
from pudu_agent.verifier import VerificationResult, verify_response
from pudu_agent.worker import ContextResult, build_context, execute_local


@dataclass(frozen=True)
class Step:
    name: str
    status: str
    input: dict[str, Any]
    output: dict[str, Any]
    duration_ms: int


@dataclass(frozen=True)
class FlowResult:
    status: str
    content: str | None
    analysis: EffortAnalysis | None
    route: ModelRoute | None
    verification: VerificationResult | None
    steps: list[Step]
    failed_step: str | None = None
    error_code: str | None = None
    telemetry_path: Path | None = None
    metrics: dict[str, Any] | None = None


def run_task(task: Task, repository: str | Path, client: OllamaClient, *,
             analyzer: Callable[..., EffortAnalysis] = analyze_effort,
             context_builder: Callable[..., ContextResult] = build_context,
             router: Callable[..., ModelRoute] = route_model,
             verifier: Callable[..., VerificationResult] = verify_response,
             telemetry_writer: Callable[..., Path] = write_run) -> FlowResult:
    steps: list[Step] = []
    started = time.monotonic()
    analysis = route = context = response = verification = None
    failed_step = error_code = None
    stage = "analyze"

    def record(name: str, input_data: dict[str, Any], output_data: dict[str, Any], begin: float) -> None:
        steps.append(Step(name, "completed", input_data, output_data,
                          max(0, int((time.monotonic() - begin) * 1000))))

    try:
        begin = time.monotonic()
        analysis = analyzer(task)
        record("analyze", {"kind": task.kind.value}, {"effort": analysis.effort.value, "origin": analysis.origin}, begin)

        stage = "context"
        begin = time.monotonic()
        context = context_builder(task, repository)
        record("context", {"repository": "local"}, {"file_count": len(context.files), "bytes_read": context.bytes_read,
               "truncated": context.truncated}, begin)

        stage = "route"
        begin = time.monotonic()
        history = task.metadata.get("model_history")
        route = router(task, client, history=history)
        record("route", {"explicit_model": task.model is not None}, {"model": route.model, "reason": route.reason,
               "origin": route.origin}, begin)

        stage = "execute"
        begin = time.monotonic()
        response = execute_local(client, route.model, context.prompt)
        record("execute", {"model": route.model, "prompt_bytes": len(context.prompt.encode("utf-8"))},
               {"content_bytes": len(response.content.encode("utf-8")), "model": response.model}, begin)

        stage = "verify"
        begin = time.monotonic()
        schema = task.metadata.get("response_schema")
        required = task.metadata.get("required_fields")
        verification = verifier(response.content, json_schema=schema if isinstance(schema, dict) else None,
                                required_fields=required if isinstance(required, list) else None)
        status = "success" if verification.status == "passed" else "failed"
        record("verify", {"verification_level": "STRUCTURAL"}, {"status": verification.status,
               "factual_correctness_checked": False}, begin)
        if status == "failed":
            failed_step, error_code = "verify", "structural_verification_failed"
    except Exception as exc:
        failed_step = stage
        error_code = f"{stage}_{type(exc).__name__.lower()}"
        steps.append(Step(stage, "failed", {}, {"error_code": error_code},
                          max(0, int((time.monotonic() - started) * 1000))))
        status = "failed"

    metrics = ({name: getattr(response, name) for name in ("prompt_tokens", "completion_tokens", "total_tokens",
                "total_duration", "load_duration", "eval_duration", "tokens_per_second")}
               if response is not None else {})
    telemetry_input = {
        "status": status,
        "effort": analysis.effort.value if analysis else None,
        "model": route.model if route else None,
        "verification": {"level": verification.level, "status": verification.status,
                         "factual_correctness_checked": False} if verification else None,
        "failure_code": error_code,
        "steps": [asdict(step) for step in steps],
        "metrics": metrics,
    }
    telemetry_path = None
    try:
        telemetry_path = telemetry_writer(repository, task.id, telemetry_input)
        begin = time.monotonic()
        record("telemetry", {"repository": "local"}, {"written": True}, begin)
    except Exception:
        if status == "success":
            status, failed_step, error_code = "failed", "telemetry", "telemetry_write_failed"
        steps.append(Step("telemetry", "failed", {}, {"error_code": "telemetry_write_failed"}, 0))
        telemetry_path = None
    return FlowResult(status, response.content if response else None, analysis, route, verification,
                      steps, failed_step, error_code, telemetry_path, metrics)
