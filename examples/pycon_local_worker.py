"""Run one opt-in local task against an already installed Ollama model."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "python"))

from pudu_agent.flow import run_task
from pudu_agent.model_client import OllamaClient, OllamaError
from pudu_agent.task import Task, TaskKind


def main() -> int:
    repo = ROOT
    task = Task(kind=TaskKind.SUMMARY, prompt="Summarize the repository in three concise bullets.", repository=str(repo))
    client = OllamaClient()
    try:
        client.health()
        models = client.list_models()
        if not models:
            print("No eligible local Ollama model is installed. Install one locally, then rerun; no cloud model will be used.")
            return 1
        print(f"Running local-only task {task.id}; eligible models: {', '.join(models)}")
        result = run_task(task, repo, client)
        if result.status != "success":
            print(f"Task failed at {result.failed_step or 'unknown'}: {result.error_code or 'no details'}")
            return 1
        print(f"Model: {result.route.model if result.route else 'N/A'}")
        print(f"Verification: {result.verification.level if result.verification else 'N/A'} / {result.verification.status if result.verification else 'N/A'} (structural only)")
        print(result.content or "")
        return 0
    except (OllamaError, OSError, ValueError) as exc:
        print(f"Local Ollama task unavailable: {exc}. Start Ollama and install a local model; cloud models are not used.")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
