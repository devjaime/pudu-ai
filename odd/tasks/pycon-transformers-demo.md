# PyCon Transformers repository demo

Build a reproducible PyCon 2026 demonstration that investigates the impact of changing `GenerationMixin.generate` in a pinned Hugging Face Transformers snapshot. The demo must show what deterministic Python tooling can prove, what remains inferred, and how local and frontier models consume bounded evidence without reading the whole repository.

## Objective

Produce an evidence-backed demo, a rendered Remotion video, an interactive reproducible Ollama execution, and a Spanish runbook that can be presented live without network access, model downloads, or modifications to the target repository.

## Problem

Literal search is noisy in a repository with thousands of Python files. Pudu currently extracts useful definitions and direct relations, but it does not provide a complete cross-file dependency traversal. The demo must demonstrate the value of ASTs and graphs without overstating their coverage.

## Why

The PyCon talk needs a recognizable, practical Python AI case that proves how deterministic tools reduce context and improve traceability for coding agents.

## Authorized scope

- Edit only this Pudu-AI worktree.
- Treat sibling `../transformers` as read-only fixture data.
- Do not download model weights or require GPU execution. Reuse only models already installed in the local Ollama runtime.
- Treat every model response as untrusted data; never execute generated commands, patches, or tool calls.
- Local commits are authorized; pushing and pull-request creation require a separate user decision.
- Delegated implementation and verification are explicitly authorized by the user.

## Constraints and conventions

| Topic | Decision |
|---|---|
| Target fixture | `huggingface/transformers` tag `v5.20.2`, commit `18329f1065382e54db698e242cf98bd3f3e5a766` |
| Investigation | Candidate impact of changing `GenerationMixin.generate` |
| Evidence labels | `CONFIRMED`, `INFERRED`, or `UNRESOLVED` |
| Ollama execution | Automatic mode requires an explicit installed model; interactive mode offers verified installed choices |
| Reproducibility | Versioned prompt/schema, controlled options, model tag and digest, evidence hash, response hash, and measured telemetry |
| Model boundary | Structural JSON validity is verified; factual correctness remains a separate human/tool validation step |
| TDD | Strict; RED → GREEN → REFACTOR for executable behavior |
| Python runner | `PYTHONPATH=python python3 -m unittest discover -s python/tests -v` |
| Remotion checks | `npm test`, `npm run typecheck`, `npm run compositions`, then `npm run render` |
| Delivery strategy | `auto-chain` |
| Chain strategy | `stacked-to-main` |
| Review heuristic | Approximately 400 authored changed lines per task/PR slice; never code-golf to meet it |

## Tasks

- [x] **PTD-001 — Capture deterministic repository evidence**
  - Route: delegated (`4+` files and executable behavior).
  - Add a standard-library Python demo command or script that validates the fixture identity and emits bounded, deterministic evidence for the generation definition, pipeline caller, model inheritance, configuration surface, and relevant tests.
  - Record every command, path, line range, relationship type, and unresolved boundary.
  - Acceptance: focused tests observe RED then GREEN; repeated runs against the pinned fixture are byte-stable except explicitly variable timing fields; no Transformers file is changed.
  - Forecast: 180–300 authored lines.

- [x] **PTD-002 — Produce an auditable demo report**
  - Route: delegated (multiple non-trivial files and documentation generated from evidence).
  - Generate or maintain a stable JSON evidence contract plus a human-readable Markdown report. Include repository identity, state-machine stages, context reduction measurements, claims, limitations, and source citations.
  - Acceptance: schema/contract tests pass; Markdown is derived from the same evidence as JSON; no claim presents candidate impact as complete runtime proof.
  - Forecast: 140–240 authored lines.

- [x] **PTD-003 — Update and render the Remotion walkthrough**
  - Route: delegated (timeline, composition, tests, captions, and rendered media).
  - Replace the generic demonstration story with the pinned Transformers investigation, showing literal search, AST filtering, graph expansion, bounded context, model roles, deterministic verification, and metrics.
  - Acceptance: timeline tests, typecheck, composition listing, and final render pass; overlays remain readable at presentation resolution; the video uses only verified claims from the evidence artifact.
  - Forecast: 220–360 authored lines plus generated media.

- [x] **PTD-004 — Write the Spanish presentation runbook and close verification**
  - Route: delegated (cross-checks code, evidence, and media).
  - Create a concise Spanish Markdown runbook with setup, exact live commands, expected output, narration, fallback plan, limitations, and the final 30-minute talk sequence.
  - Acceptance: all referenced paths and commands exist; a fresh verifier reruns applicable checks; final artifacts and commit identities are recorded below.
  - Forecast: 120–200 authored lines.

- [x] **PTD-005 — Extend the Ollama client contract**
  - Route: delegated (client behavior and tests span multiple non-trivial files).
  - Preserve model tag and digest from `/api/tags`, capture the Ollama server version when available, and support explicit JSON formatting plus controlled generation options.
  - Acceptance: strict TDD observes RED then GREEN; requests include only allow-listed reproducibility options; existing callers remain compatible; client tests cover malformed and missing runtime metadata.
  - Implementation: added immutable `ModelInfo` and `list_model_details()` while retaining `list_models()` as `list[str]`; digest is preserved when provided and remains optional for older/mocked responses. Added bounded `server_version()` parsing for `/api/version`. Generation accepts only `format="json"` and an options object containing `temperature` (finite 0–2) and/or `seed` (non-negative 32-bit integer); unknown fields and invalid shapes are rejected. Existing loopback transport, response cap, cloud-tag filter, and request privacy behavior are unchanged. Correction: cloud tags are discarded before digest validation; temperature range comparisons reject arbitrarily large integers with `ValueError` without float conversion.
  - Route evidence: delegated writer route retained from the task plan because the client contract and its tests are separate non-trivial files; no additional exploration was needed beyond the client, focused tests, and known callers.
  - TDD evidence: RED — `PYTHONPATH=python python3 -m unittest python.tests.test_task_core -v` failed at test-module import with `ImportError: cannot import name 'ModelInfo'`, confirming the new contract was absent. GREEN — the same command passed 20/20 tests after implementation. Refactor — hardened version parsing against blank, over-128-character, and control-character values; focused tests remained green.
  - Verification: `PYTHONPATH=python python3 -m unittest python.tests.test_task_core -v` — 20 passed; `PYTHONPATH=python python3 -m unittest discover -s python/tests -v` — 50 run, 1 skipped, all others passed; `git diff --check` — passed; `git -C /Volumes/KINGSTON/pudu-pycon-2026/transformers status --porcelain` — empty. Runtime harness: N/A; all client requests are covered with mocked HTTP responses and no Ollama server/model is required.
  - Independent verifier correction: findings were (1) malformed digest on a cloud-only tag incorrectly broke local listing, and (2) a huge temperature integer raised `OverflowError` from `math.isfinite()`. Correction filters cloud entries before digest parsing and uses bounded numeric comparisons, preserving `ValueError` for invalid temperatures.
  - Correction TDD evidence: RED — `PYTHONPATH=python python3 -m unittest python.tests.test_task_core -v` reproduced both defects: `OllamaError: Ollama returned an invalid model digest` for the cloud entry and `OverflowError: int too large to convert to float` for `temperature=10**400`. GREEN — focused suite passed 21/21 after correction.
  - Verification: original commit `790abac` — focused 20/20 and full suite 50 run, 1 skipped; correction commit `fix(ollama): harden response metadata validation` — focused 21/21, full suite 51 run, 1 skipped, `git diff --check` passed, and external Transformers fixture porcelain was empty. Runtime harness: N/A; all client requests are covered with mocked HTTP responses and no Ollama server/model is required.
  - Rollback boundary: revert the correction commit to restore `790abac`; revert `790abac` separately only to remove the original client API unit. No unrelated behavior or fixture files are included.
  - Forecast/actual: original 140–240 authored lines / 129 authored additions and deletions; correction changed only this client, its focused tests, and the PTD-005 evidence in this tracker.

- [x] **PTD-006 — Add the interactive reproducible Ollama demo**
  - Route: delegated (new orchestration, validation, persistence, CLI UX, and tests).
  - Feed only the bounded deterministic Transformers evidence into a versioned prompt and JSON contract. Add interactive installed-model selection and automatic mode with an explicit model selector.
  - Persist an atomic redacted run manifest under ignored `.pudu-ai/pycon-demo/` containing fixture, evidence, prompt/schema, model/runtime, options, telemetry, validation, and response hashes without storing full evidence or response by default.
  - Acceptance: strict TDD observes RED then GREEN; offline/fake-client tests cover success and failures; repeated fixture preparation is byte-stable; no model output is executed or promoted to factual proof.
  - Forecast: 260–400 authored lines.
  - Commit: `9cfc869 feat(pycon): add reproducible Transformers Ollama demo` (365 authored changed lines: 362 additions, 3 deletions; within forecast).
  - Implementation: added `python/pudu_agent/transformers_ollama_demo.py` with exact fixture-root enforcement and collector verification before client construction; explicit `--model TAG` automatic mode; bounded interactive selection of installed tag+digest models; fixed `temperature=0`/seed `20260520`; exact response-model identity check; stdlib structural validation; and atomic redacted manifests. Added versioned prompt/schema assets under `docs/demos/pycon-2026/ollama/`. Output is a Spanish presentation summary plus JSON; responses are explicitly model interpretation and structural validity is not factual validation. Manifests include fixture, evidence/prompt/schema/response hashes and sizes, model identity, server version, options, wall latency, observed token/duration fields only, and validation state; prompt/evidence/response text is omitted.
  - Route evidence: delegated writer route as planned because orchestration, tests, prompt/schema assets, and the task record are coordinated non-trivial changes. The session's scoped exploration established the existing collector and client contracts; implementation stayed in this worktree and did not edit the Transformers fixture.
  - TDD evidence: RED — `PYTHONPATH=python python3 -m unittest python.tests.test_transformers_ollama_demo -v` failed on import because the new module did not exist. GREEN — focused suite passed 7/7 after implementation. REFACTOR — extracted observed-metric projection and hardened exact fixture-root validation; focused suite passed 8/8.
  - Verification: focused `PYTHONPATH=python python3 -m unittest python.tests.test_transformers_ollama_demo -v` — 8 passed; full `PYTHONPATH=python python3 -m unittest discover -s python/tests -v` — 59 run, 1 skipped, remaining passed; offline CLI rehearsal through `main()` with fake Ollama client passed both automatic and interactive flows, including cancellation/invalid selection and no network; `git diff --check` — passed. Two canonical collector runs were byte-identical (5,076 bytes); collector returned exact pinned identity `v5.20.2` / `18329f1065382e54db698e242cf98bd3f3e5a766`; fixture `git status --porcelain` was empty. No Ollama server/model was contacted.
  - Schema/manifest decisions: response contract `pudu.transformers-ollama-analysis/v1` requires a summary and at most 12 `INFERRED`/`UNRESOLVED` findings with bounded strings and evidence-reference arrays; only stdlib JSON/shape checks are used. Manifest schema is `pudu.transformers-ollama-manifest/v1`, written by fsync + atomic replace under ignored `.pudu-ai/pycon-demo/`.
  - Rollback boundary: revert the PTD-006 work-unit commit to remove the new module, its tests, prompt/schema assets, and this task evidence; prior deterministic snapshots, PTD-005 client behavior, and external fixture remain untouched.
  - Risks: temperature zero and fixed seed do not guarantee identical output across runtimes; model claims are not factual proof. Interactive user wait is outside measured generation wall latency. Manifest names/timestamps are intentionally unstable; deterministic evidence, prompt, and schema bytes are hash-addressed.
  - Independent verification correction (P1): review reproduced arbitrary `--manifest-dir` writes and writes through a symlinked `.pudu-ai`/`pycon-demo` directory. Removed the public override; the destination is now resolved from the trusted module location and fixed to this project’s `.pudu-ai/pycon-demo`. Directory components are checked without following links, traversed through directory descriptors with `O_NOFOLLOW`, and file creation/replacement remains atomic and anchored to that directory.
  - Correction TDD: RED — focused suite failed three confinement assertions: the CLI accepted and wrote to an arbitrary manifest directory, and both symlink-component variants followed the link to the outside directory. GREEN — focused suite passed 10/10 after the fix.
  - Correction verification: full Python suite 61 run, 1 skipped; `git diff --check` passed; external Transformers fixture porcelain empty. New direct regression tests assert arbitrary-path rejection/absence and rejection of symlinked `.pudu-ai` and `pycon-demo` components without outside writes.
  - Correction rollback boundary: revert the separate PTD-006 confinement correction commit to restore the original manifest-path behavior; this reintroduces the reproduced P1. The original demo implementation commit and PTD-007 remain separate.
  - Correction commit: `881393f fix(pycon): confine Ollama demo manifests`.

- [x] **PTD-007 — Document and rehearse the one-command workflow**
  - Route: delegated (cross-checks executable commands, generated manifest, and presentation narrative).
  - Add one automatic command and one interactive command to the Spanish runbook, plus concise English and neutral-professional Spanish quick paths in the root README linking to the full runbook. Preserve the existing deterministic `MODEL_ANALYSIS: NOT_RUN` snapshot as the no-model baseline and explain that live Ollama runs create separate ignored manifests.
  - Acceptance: commands and paths exist; deterministic tests and a fake-runtime rehearsal pass; a live run is attempted only when an already-running Ollama server and installed model are available; limitations state that temperature zero and a fixed seed do not guarantee identical text across runtimes.
  - Forecast: 100–180 authored lines.
  - Implementation: extended `docs/demos/pycon-2026/DEMO_RUNBOOK.es.md` with the Ollama no-download preflight, exact-tag automatic and interactive commands, expected stages, redacted manifest behavior, trust boundary, failure behavior, and 3-minute optional segment while retaining the deterministic 9-minute demo and 30-minute talk. Added English/Spanish concise entry points to `README.md`.
  - Verification: `PYTHONPATH=python python3 -m pudu_agent.transformers_ollama_demo --help` — passed; `PYTHONPATH=python python3 -m unittest python.tests.test_transformers_ollama_demo -v` — 10/10 passed; `PYTHONPATH=python python3 -m unittest discover -s python/tests -v` — 61 run, 1 skipped (live Ollama integration opt-in); added relative links checked (README→Spanish runbook, demo module, prompt/schema assets), all targets exist. Manifest destination was verified in code and `.gitignore`; it is created only by successful live execution. `git diff --check` — passed; external fixture `git status --porcelain` — empty. `ollama --version` — exit 0, client 0.30.11; reports no running instance. `ollama list` — exit 1, could not connect to `127.0.0.1:11434` (`operation not permitted`). No live demo run was attempted because the local server/model availability was not established; no service was started and no model was pulled. Fake-runtime CLI paths are covered by the focused tests. The existing ignored MP4 is absent from this managed worktree; the runbook flags it for presentation-machine preflight and no video was changed.
  - Rollback boundary: revert the PTD-007 docs commit to remove only this runbook/README/tracker update; deterministic report snapshots, Ollama implementation/assets, Remotion source, generated MP4, and external fixture are untouched.
  - Commit: `8bd2d24 docs(pycon): add Ollama demo runbook`; neutral-language correction: `589540b docs(pycon): use neutral Spanish quickstart` (8 authored changed lines: 4 additions, 4 deletions).
  - Independent verification corrections: the verifier found a stale off-branch commit hash in this tracker and Rioplatense imperatives in the new Spanish quick path/runbook segment. Corrected tracker evidence to cite the delivered docs commit and language correction; normalized only the PTD-007 additions to neutral-professional Spanish.
  - Correction verification: reran CLI help, focused tests (10/10), full Python suite (61 run, 1 skipped), added-link/path audit, `git diff --check`, and external fixture clean check; all passed. No Ollama service or model was started or installed.
  - Correction rollback boundaries: revert `589540b` only to restore the prior PTD-007 imperatives; revert the tracker-only evidence correction separately to restore the prior task-record wording. Neither touches Python behavior, snapshots, Remotion source, MP4, or the fixture.

## Progress and evidence

| Task | Status | Commit | Verification | Review state |
|---|---|---|---|---|
| PTD-001 | Complete | `4df6d9a` | Focused 5/5; full Python suite 42 run, 1 skipped; two CLI runs byte-identical (6,808 bytes); nested-root rejection; fixture clean; independent verifier PASS | RDD disabled/unmanaged; risk assessment unassessable because files were initially untracked, treated as high and independently verified |
| PTD-002 | Complete | `27448a6` | Focused 3/3; full Python suite 45 run, 1 skipped; JSON and Markdown reproduced byte-identically and matched snapshots; 99.55% byte reduction independently recalculated | RDD disabled/unmanaged; untracked assessment treated as high and independently verified PASS |
| PTD-003 | Complete | `ecce5f2`, `a1f2f5e` | Tests 11/11; typecheck; two compositions discovered; 1920×1080/30 fps/90 s H.264 render; VTT/scene alignment; visual inspection; SHA-256 `16d4295188f1fca85bbaa11e1b7e116c70261d9617f971d1340f5fcd7d4e26d3` | RDD disabled/unmanaged; high/unassessable candidate independently verified PASS; delivered as 140-line and 75-line stacked units |
| PTD-004 | Complete | `2e48c82` | Runbook link audit 15/15; Python suite 45 run, 1 skipped; reports reproduce exactly; Remotion 11/11, typecheck, two compositions; MP4 checksum/ffprobe; fixture clean | Independent verifier unavailable because the delegated account hit its usage limit; parent completed structural readback and all applicable deterministic checks |
| PTD-005 | Complete | `790abac` + `fix(ollama): harden response metadata validation` | Initial RED/GREEN 20/20; correction RED reproduced both verifier findings; correction GREEN focused 21/21, full suite 51 run, 1 skipped; diff check clean; external fixture porcelain empty | Initial RDD state not queried by executor; parent verifier found two P2s, both corrected in a separate scoped commit |
| PTD-006 | Complete | `9cfc869`, `881393f` | Original RED/GREEN; P1 confinement RED reproduced arbitrary and symlink writes, then focused GREEN 10/10; full suite 61 run, 1 skipped; fixture clean; diff check passed | Writer did not query RDD state; parent to assess/route correction commit |
| PTD-007 | Complete | `8bd2d24`, `589540b` | CLI help; focused 10/10; full 61 run, 1 skipped; added links/paths; diff check; fixture clean. Live Ollama unavailable (client 0.30.11; no local server/model verified; no live inference claimed). Independent documentation correction: stale commit reference and regional imperatives fixed. | RDD disabled/unmanaged; documentation-only structural readback |

## Capability boundary

Pudu can locate literal references, inspect Python AST structure, extract direct edges, and query candidate relationships. It cannot yet prove complete runtime impact across dynamic registries, late binding, generated mappings, or native extensions. The presentation must keep those boundaries visible rather than hiding them behind an LLM summary.

## External synchronization

- Kingston Pudu worktree fast-forwarded through `47157ab` on `codex/pycon-transformers-demo`.
- Pinned Transformers fixture remains clean at `18329f1065382e54db698e242cf98bd3f3e5a766` (`v5.20.2`).
- Ignored MP4 copied to the external worktree and verified as SHA-256 `16d4295188f1fca85bbaa11e1b7e116c70261d9617f971d1340f5fcd7d4e26d3`.
- No branch was pushed and no pull request was opened.

## Next step

PTD-007 is documented and verified; the next step is a live rehearsal only when Ollama is already available with an installed local model. Push or pull-request creation still requires explicit authorization.
