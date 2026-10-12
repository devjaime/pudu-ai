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
- TypeScript runner: `./node_modules/.bin/vitest run tests/task-cli.test.ts --pool=threads --maxWorkers=1 --no-file-parallelism`
- Full checks: `npm run typecheck`, `npm test`, `npm run build`

## Delivery

- Strategy: `stacked-to-main` (explicitly selected for this ordered chain).
- Forecast: approximately 2,054 authored changed lines across eight work-unit slices, excluding generated Archify HTML and visual-check assets.
- Chain strategy: `stacked-to-main` — each PR ultimately targets `main`; later PRs open after predecessors merge and rebase.
- PR order: 01 core; 02 core fixes; 03 routing/verification; 04 telemetry; 05 bounded worker; 06 flow; 07 CLI/demo; 08 Archify and tracker closure.
- Branches: `codex/local-task-worker-01-core` through `codex/local-task-worker-08-archify` (see branch tips below).

## Tasks

- [x] **LTW-001 — Secure Python task core**
  - Route: delegated (`odd-worker`); multiple non-trivial Python files trigger writer delegation.
  - Write failing tests first for task parsing, loopback endpoint validation, Ollama response parsing, missing metrics, unavailable Ollama, and no installed models.
  - Implement task contracts and the bounded Ollama client using stdlib.
  - Acceptance: unit tests prove the HTTP client never uses cloud endpoints, proxies, redirects, or invented metrics.
  - Checks: `python3 -m unittest discover -s python/tests -v` — 14 tests passed. HTTP is mocked; no Ollama/network call.
  - Evidence: Initial RED — test-first run failed because prompt-based Task fields, literal-loopback default/restrictions, cloud filtering, and response metrics were absent; follow-up RED isolated the `:cloud` suffix matcher defect. GREEN — same command passed all 14 tests after corrections. Runtime harness: N/A; no runtime flow exists in LTW-001. Rollback boundary: revert `python/pudu_agent/task.py`, `python/pudu_agent/model_client.py`, `python/tests/test_task_core.py`, and this LTW-001 evidence. Chain commits: `879ec3d` (slice 01), `17fe2b3` and `a490d2a` (slice 02). Correction authored line count: 120 additions/deletions (under 400). RDD assessment: `medium`, `under_budget`, base boundary `3979cd3`.

- [x] **LTW-002 — Deterministic local task flow**
  - Route: delegated (`odd-worker`); flow spans analyzer, router, context, verifier, and telemetry modules.
  - Write failing tests first for effort classification, routing, context containment/limits, flow failure propagation, structural verification, and telemetry serialization.
  - Implement a linear analyze → context → route → execute → verify → record flow.
  - Acceptance: no generated command or code is executed; telemetry is repo-local and redacted.
  - Checks: `python3 -m unittest discover -s python/tests -v` — 30 tests passed; all Ollama use was mocked.
  - Evidence: RED — first test-first run failed to import the not-yet-created `pudu_agent.flow`; subsequent checks exposed missed timeout state and an invalid reused empty-model fixture. GREEN/refactor — corrected bounded context deadlines, routed model filtering, redacted atomic telemetry, and structural verification; final required command passed all 30 tests. Runtime harness: N/A; mocked client and no real Ollama. Rollback boundary: remove `python/pudu_agent/router.py`, `worker.py`, `verifier.py`, `telemetry.py`, `flow.py`, `python/tests/test_task_flow.py`, and revert only LTW-002 tracker evidence. Authored changed-line count: 794 additions/deletions; exceeds the 400-line heuristic because the requested safety behavior and focused coverage form one cohesive work unit. The final implementation is split across chain slices 03–06; see the merged PR records below.
  - Independent-verifier follow-up: explicit candidate paths now apply automatic skip/sensitive exclusions; explicit model selection cannot fall back; telemetry accepts only known step names/statuses; final UTF-8 prompt including headers is capped at 64,000 bytes. RED — regression tests failed on missing final-cap constant and absent-preferred fallback. A later run exposed a fixture assertion that also matched the visible file; corrected the fixture. GREEN — final required command passed all 34 tests. Independent re-verification: PASS; exact prior reproductions are closed and the multibyte prompt measured 63,999/64,000 bytes. Residual limitation: Python urllib timeout is a per-socket-operation timeout, not guaranteed end-to-end cancellation; a progressing in-flight response may outlive the configured duration. Rollback boundary: revert `python/pudu_agent/worker.py`, `python/pudu_agent/model_client.py`, `python/pudu_agent/telemetry.py`, `python/tests/test_task_core.py`, `python/tests/test_task_flow.py`, and this follow-up evidence only. Authored changed-line count: 104 additions/deletions. Core, telemetry, and worker corrections are included in slices 02, 04, and 05. RDD: clone-locally disabled by explicit user request after provider defect #5129; verification proceeded through writer tests plus independent verifier.

- [x] **LTW-003 — CLI, demo, and user documentation**
  - Route: delegated (`odd-worker`); TypeScript, Python example, tests, and docs are one user-facing work unit.
  - Write failing CLI tests first for singular `task`, `--task`, `--repo`, `--model`, and `--json` parsing/dispatch.
  - Dispatch before `loadSession`, reuse the Python bridge, and preserve plural `tasks` behavior.
  - Add a no-model/no-Ollama graceful PyCon example and exact usage documentation.
  - Acceptance: existing hardware commands remain Python-independent and the new command emits stable JSON.
  - Checks: focused Vitest, Python tests, CLI smoke scenarios.
  - Evidence: RED — `python3 -m unittest discover -s python/tests -p 'test_task_protocol.py' -v` failed before implementation because `handle_task` did not exist. GREEN — `python3 -m unittest discover -s python/tests -v` passed 37 tests (1 opt-in live test skipped); `node_modules/.bin/vitest run tests/task-cli.test.ts --pool=forks --maxWorkers=1 --minWorkers=1 --reporter=verbose` passed 1 test. Mocked protocol tests cover unavailable Ollama and no eligible model without network. Runtime smoke: built CLI returned structured JSON failure for nonexistent repository (exit 1; nullable metrics and DERIVED provenance present); `tasks --json --no-network` remained successful (exit 0). `npm run typecheck` passed; `npm run build` passed. Rollback boundary: remove `src/cli/task-run.ts`, `examples/pycon_local_worker.py`, `tests/task-cli.test.ts`, `python/tests/test_task_protocol.py`, `python/tests/test_task_live.py`; revert only task-related hunks in `src/cli/parse-args.ts`, `src/cli/run.ts`, `python/pudu_agent/search.py`, `python/pudu_agent/flow.py`, both Agent Lab usage docs, and this LTW-003 evidence. Preserve pre-existing web hunks in the CLI files and all unrelated dirty/untracked work. Authored changed-line count: 316 additions/deletions (311 insertions, 5 deletions; under the advisory 400-line budget). Chain commit: `3ac8c0c` on slice 07; the verifier correction is included in that focused slice. RDD: clone-locally disabled by explicit user request; no native review invoked.
  - Verifier correction: RED — `./node_modules/.bin/vitest run tests/task-cli.test.ts --pool=threads --maxWorkers=1 --no-file-parallelism` initially failed 7/8 tests (then-current regression set): singular bare/invalid invocations were not dispatched, local failure JSON omitted `status`, and the validator accepted a failure envelope without it. GREEN — the exact command passed 10/10 tests after intercepting every `task` command before help/session loading, returning `status: failed` for usage errors, and requiring that status on Python failure envelopes. Additional checks: `npm run typecheck` PASS; `npm run build` PASS; `git diff --check` PASS; `python3 -m unittest discover -s python/tests -v` PASS (37 passed, 1 opt-in skip). No Ollama/network call. Rollback boundary: revert only the additional LTW-003 hunks in `src/cli/run.ts`, `src/cli/task-run.ts`, `tests/task-cli.test.ts`, and this follow-up tracker line; preserve all pre-existing web changes. Correction authored changed-line count: 61 additions/deletions (50 insertions, 11 deletions; under the advisory budget). Verifier correction commit: `3ac8c0c` on slice 07.

- [x] **LTW-004 — Evidence-based Archify diagram**
  - Route: delegated (`odd-worker`); generated artifact requires Archify validation and browser evidence.
  - Added `docs/diagrams/local-task-worker-flow.json` and delivered `docs/diagrams/local-task-worker-flow.html`, based on the implemented local task path. The diagram covers CLI/JSON bridge, TaskRequest analysis, bounded context, local model routing, loopback Ollama worker, structural verification, JSONL telemetry, and structured return; cards state local-only security and structured failures.
  - Authored content is neutral Spanish. `meta.locale` is omitted because Archify does not support Spanish Viewer UI; fixed Viewer UI and `<html lang>` fall back to English.
  - Acceptance: diagram matches actual components, local/security boundaries, telemetry, and failure paths — complete.
  - Checks: `node bin/archify.mjs doctor` PASS; final workflow showcase validate 9/9, 0 errors, 0 warnings; deliver PASS (specification SHA-256 `652bb0970d02cd098246f54e9e88e54dbb1a65e6d0c0d84c584020cd6671180b`, artifact SHA-256 `f009deb75d4c8410d2a289c6a639334d27c9b9fc03cef16af0891246b5d89ed5`); browser visual-check PASS bound to the same artifact hash, with containment/readability/viewerChrome/captures PASS and exact viewport containment at 1440×900, 1600×1000, 1920×1080, and 2048×1320; perceptual visual review PASS on all four screenshots (light/dark at 1440×900 and 2048×1320), with no clipping, crossings, obscured labels, cut cards, or conspicuous lower band. One focused containment correction round.
  - Evidence sidecars: `docs/diagrams/local-task-worker-flow.visual-check.json`, `.visual-check.html`, `.visual-check.1440x900.light.png`, `.visual-check.1440x900.dark.png`, `.visual-check.2048x1320.light.png`, `.visual-check.2048x1320.dark.png`.
  - The Archify artifacts and closure evidence are delivered in slice 08.

- [x] **LTW-005 — Full verification and closure**
  - Route: delegated (`odd-verify`); execution checks require independent verification.
  - Run Python tests, focused/full Vitest, typecheck, build, CLI smoke tests, and opt-in integration gating without requiring Ollama.
  - Record every pass, failure, skip, and environmental limitation honestly.
  - Acceptance: all required non-integration checks pass and live Ollama remains opt-in.
  - Checks: full project verification matrix — PASS.
  - Evidence: independent verification found no actionable P0-P3 findings. `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s python/tests -v` passed 37 tests with the single live Ollama test skipped by default; focused Vitest passed 10/10; full Vitest passed 73/73 across 21 files; `npm run typecheck`, `npm run build`, and `git diff --check` passed. Built CLI smoke checks for bare, unknown, and extra-argument singular `task` invocations returned structured JSON failures with exit 1 before session/cloud/Ollama work. Static demo import/path checks passed; live inference was not exercised. A mistaken `examples/pycon_local_worker.py --help` verification attempt contacted only the configured loopback Ollama health endpoint and exited 1 because the demo intentionally has no help parser; no further demo invocation was made. Archify showcase validation remained 9/9 with no warnings, the current HTML SHA-256 matches the automated browser receipt, and the receipt passes all four desktop viewports. Residual limitation: urllib socket timeout is not a strict end-to-end deadline. RDD remained clone-locally disabled by explicit user request, so closure used ordinary functional checks plus an independent verifier.
  - Final chain verification is recorded in slice 08. Slice 07 was delivered by PR #13, merged as `46e2fe7`; `3ac8c0c` is its original feature work-unit commit, not the branch tip.

## Stacked PR Chain

| Order | Slice | Delivery record |
|---|---|---|
| 01 | Core | PR #7 merged to `main` at `af628e4f3d7ae77b599ee3ff2daee9c04aa9f970` |
| 02 | Core fixes | PR #8 merged to `main` at `c269225dd7dd818741a19ab3e744827f651b90dc` |
| 03 | Routing/verification | PR #9 merged to `main` at `22d4cc10d02608f93a3e951a7ae128ce8968fcca` |
| 04 | Telemetry | PR #10 merged to `main` at `ea8fb287902202d3d4b5ae965c6a014d15a2b56d` |
| 05 | Bounded worker | PR #11 merged to `main` at `be3a58f85f99aedf55f0520bd4eba2496522c0db` |
| 06 | Flow | PR #12 merged to `main` at `6167ce43d34bfcd2756cd9ce5988270db960410b` |
| 07 | CLI/demo | PR #13 merged to `main` at `46e2fe7cddde3ee3361867ec88581847a3cef79a` |
| 08 | Archify/closure | Final slice on `codex/local-task-worker-08-archify`; this PR is the only remaining chain unit. |

All merged PRs targeted `main` sequentially and passed both required CI jobs before the authorized squash merge. Slice 08 contains 190 authored specification lines plus the tracker closure; the generated HTML and visual-check sidecars remain part of the artifact snapshot but are excluded from authored-line budgeting. The feature chain is complete after this final slice passes checks and merges.

## Progress

- Feature branch created from `main` while preserving the pre-existing dirty working tree.
- Architecture review completed before implementation.
- LTW-001 implemented the text-only task contract and loopback-only bounded stdlib Ollama client; mocked unit tests pass.
- LTW-002 adds deterministic routing, bounded read-only context, structural verification, redacted telemetry, and linear task orchestration.
- LTW-003 adds the guarded CLI bridge, PyCon demo, bilingual usage documentation, and stable structured failures.
- LTW-004 delivers a showcase-validated, browser-checked, perceptually reviewed Archify workflow.
- LTW-005 closes the feature with independent Python, TypeScript, build, smoke, and artifact verification. PRs #7–#13 are merged; this branch carries the final Archify artifact and tracker closure.

## Next Step

This is the final slice of the stacked-to-main chain. After its authored diff, artifact receipts, local checks, and GitHub CI pass, merge this PR to `main`; no follow-up slice remains.
