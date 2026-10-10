# Local Task Worker

## Objective

Implement the smallest local-first vertical slice that accepts a textual task, analyzes repository effort, selects an eligible installed Ollama model, builds bounded repository context, executes inference, performs deterministic structural verification, and stores truthful local telemetry.

## Problem

Pudu-AI can inspect repositories, plan model harnesses, and measure hardware, but it does not yet execute an observable local software task. The new slice must extend Agent Lab without replacing the TypeScript application boundary, changing Pudu-AI Score, or turning Python into a mandatory dependency.

## Why

The slice enables a reproducible PyCon demonstration of deterministic retrieval plus local inference while preserving Pudu-AI's local-first and measurement-provenance guarantees.

## Scope

- Add a text-only Python task model and linear task flow.
- Use the existing TypeScript-to-Python JSON subprocess bridge.
- Add a loopback-only Ollama HTTP client with bounded requests and optional metrics.
- Add deterministic effort analysis, model routing, bounded context, structural verification, and redacted repo-local telemetry.
- Add the experimental singular `pudu-ai task run` command without changing plural `tasks`.
- Add a reproducible Python example and an evidence-based Archify workflow diagram.
- Add unit tests with mocked HTTP and one explicitly opt-in live Ollama integration test.

## Out of Scope

- Productive file edits by a model.
- LLM-generated shell execution.
- Persistent queues, schedulers, daemons, worktrees, GitHub automation, retries across model tiers, or task scoring.
- Cloud endpoints, cloud fallback, Pudu-AI Score changes, or hardware telemetry changes.

## Constraints

- JSON is the stable TypeScript/Python boundary.
- Python remains optional for existing hardware and benchmark commands.
- Telemetry is stored under `.pudu-ai/task-telemetry/` and excludes prompt/context bodies and credentials.
- Missing metrics remain `null`; derived values are labelled `DERIVED`.
- Verification is explicitly structural and does not claim factual task correctness.
- Context paths must remain inside the resolved repository root, including symlink handling.
- Existing uncommitted work must be preserved and unrelated changes must not enter feature commits.

## TDD

- Mode: strict
- Source: repository AGENTS.md (`Strict TDD Mode: enabled`)
- Python runner: `python3 -m unittest discover -s python/tests -v`
- TypeScript runner: `npm test -- --run tests/agent-lab-task.test.ts`
- Full checks: `npm run typecheck`, `npm test`, `npm run build`

## Delivery

- Strategy: `ask-on-risk`
- Forecast: approximately 850 authored changed lines, excluding generated Archify HTML and visual-check images.
- Chain strategy: `stacked-to-main` — small ordered PR slices that merge to `main` sequentially.
- Planned slices: LTW-001, LTW-002, LTW-003, and LTW-004/005 closure, subject to cohesive work-unit boundaries.
- Branch: `codex/local-task-worker`

## Tasks

- [ ] **LTW-001 — Secure Python task core**
  - Route: delegated (`odd-worker`); multiple non-trivial Python files trigger writer delegation.
  - Write failing tests first for task parsing, loopback endpoint validation, Ollama response parsing, missing metrics, unavailable Ollama, and no installed models.
  - Implement task contracts and the bounded Ollama client using stdlib.
  - Acceptance: unit tests prove the HTTP client never uses cloud endpoints, proxies, redirects, or invented metrics.
  - Checks: focused Python unit tests.
  - Evidence: pending.

- [ ] **LTW-002 — Deterministic local task flow**
  - Route: delegated (`odd-worker`); flow spans analyzer, router, context, verifier, and telemetry modules.
  - Write failing tests first for effort classification, routing, context containment/limits, flow failure propagation, structural verification, and telemetry serialization.
  - Implement a linear analyze → context → route → execute → verify → record flow.
  - Acceptance: no generated command or code is executed; telemetry is repo-local and redacted.
  - Checks: focused Python unit tests.
  - Evidence: pending.

- [ ] **LTW-003 — CLI, demo, and user documentation**
  - Route: delegated (`odd-worker`); TypeScript, Python example, tests, and docs are one user-facing work unit.
  - Write failing CLI tests first for singular `task`, `--task`, `--repo`, `--model`, and `--json` parsing/dispatch.
  - Dispatch before `loadSession`, reuse the Python bridge, and preserve plural `tasks` behavior.
  - Add a no-model/no-Ollama graceful PyCon example and exact usage documentation.
  - Acceptance: existing hardware commands remain Python-independent and the new command emits stable JSON.
  - Checks: focused Vitest, Python tests, CLI smoke scenarios.
  - Evidence: pending.

- [ ] **LTW-004 — Evidence-based Archify diagram**
  - Route: delegated (`odd-worker`); generated artifact requires Archify validation and browser evidence.
  - Generate an Archify workflow diagram from the implemented code path, not the proposal alone.
  - Deliver deterministic HTML, run visual-check, and perform perceptual inspection of produced screenshots.
  - Acceptance: diagram matches actual components, local/security boundaries, telemetry, and failure paths.
  - Checks: Archify doctor, validate/deliver receipt, visual-check, screenshot review.
  - Evidence: pending.

- [ ] **LTW-005 — Full verification and closure**
  - Route: delegated (`odd-verify`); execution checks require independent verification.
  - Run Python tests, focused/full Vitest, typecheck, build, CLI smoke tests, and opt-in integration gating without requiring Ollama.
  - Record every pass, failure, skip, and environmental limitation honestly.
  - Acceptance: all required non-integration checks pass and live Ollama remains opt-in.
  - Checks: full project verification matrix.
  - Evidence: pending.

## Progress

- Feature branch created from `main` while preserving the pre-existing dirty working tree.
- Architecture review completed before implementation.
- No source implementation has started.

## Next Step

Begin LTW-001 with an observed RED test.
