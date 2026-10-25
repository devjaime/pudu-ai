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
| Ollama endpoint | Explicit loopback endpoint only; live local-only rehearsal uses a separate server with `OLLAMA_NO_CLOUD=1` |
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


- [x] **PTD-008 — Rehearse against an isolated local-only Ollama endpoint**
  - Route: delegated (CLI contract, tests, bilingual operational docs, and live runtime verification).
  - Add an explicit loopback-only Ollama endpoint option so the demo can target a separate server started with `OLLAMA_NO_CLOUD=1` without stopping or reconfiguring the shared daemon.
  - Acceptance: strict TDD observes RED then GREEN for endpoint forwarding/rejection; automatic and interactive modes use the selected endpoint; docs show the isolated-server preparation; a live run uses an already installed model and records a redacted manifest; no model is pulled and no shared service is stopped.
  - Forecast: 120–220 authored lines plus ignored runtime manifest.
  - Implementation: added `--ollama-url` (default `http://127.0.0.1:11434`) and validates it through the existing `validate_endpoint` before fixture collection or client construction. The exact normalized loopback URL is passed to `OllamaClient` in automatic and interactive modes and recorded in the redacted manifest. Expanded the English and neutral-professional Spanish quick paths and Spanish runbook with a separate server on unused port `11435`, reuse-only/no-pull guidance, and the distinction between the operator's `OLLAMA_NO_CLOUD=1` assertion and API attestation. No Ollama process or model was started, stopped, pulled, or reconfigured.
  - Route evidence: delegated writer route as assigned because code, tests, and bilingual operations docs are coordinated non-trivial files. Existing collector/client contracts were followed; endpoint checking happens first so invalid URLs fail before fixture or Ollama work.
  - TDD evidence: RED — focused module tests failed 4 assertions and errored once: default URL forwarding received `None`; interactive CLI rejected `--ollama-url`; three invalid URLs reached the collector instead of failing preflight. GREEN — `PYTHONPATH=python python3 -m unittest python.tests.test_transformers_ollama_demo -v` passed 11/11, including default/custom forwarding in automatic/interactive modes, manifest endpoint, and invalid endpoint rejection before collector/client creation.
  - Verification: full `PYTHONPATH=python python3 -m unittest discover -s python/tests -v` — 62 run, 1 skipped (opt-in live Ollama integration); CLI `--help` lists default and custom endpoint option; documentation command audit confirmed isolated server, list, and demo commands all target `127.0.0.1:11435`, with operator-assertion caveat; `git diff --check` passed; `/Volumes/KINGSTON/pudu-pycon-2026/transformers` porcelain was empty. Offline fake-client tests cover both modes; no live rehearsal was run and this acceptance remains pending.
  - Commit: `2b96299 feat(pycon): support isolated Ollama endpoint` (68 authored changed lines: 54 additions, 14 deletions; includes module, tests, README, and runbook).
  - Schema/manifest decision: retained manifest schema v1 and added the normalized endpoint as `ollama_endpoint`; endpoint is bounded by the existing literal-loopback validator, without introducing a new dependency or response contract.
  - Rollback boundary: revert `2b96299` to remove endpoint selection/manifest field and associated documentation/tests; prior default-endpoint behavior and PTD-006 manifest confinement return. Deterministic snapshots and external fixture are untouched.
  - Remaining limits: startup logs report cloud disabled, but this is operational evidence rather than an API attestation. Port availability and installed-model visibility remain operator preflight responsibilities; the successful pilot does not establish model quality or comparative superiority.
  - Failed live attempt: the authorized isolated run selected `qwen3.5:4b`; cold load took approximately 6.6 seconds and prompt evaluation approximately 3.5 seconds, exceeding the inherited 10-second socket timeout before output. The call exited 2 with `Ollama request failed: timed out`; no manifest was written. No service or model state was changed by the correction.
  - Timeout correction: added `--ollama-timeout-seconds` with default 120 and strict finite `(0, 600]` validation before fixture collection/client creation; the value is passed to the existing client's socket timeout and recorded as `ollama_timeout_seconds` in the redacted manifest. Documentation clarifies cold starts may exceed 10 seconds and this bounds socket operations, not an end-to-end deadline.
  - Correction TDD: RED — focused suite failed 9 assertions and errored once: CLI option was absent, invalid timeout cases (`True`, NaN, infinity, zero, negative, >600, huge integer) reached collection, and timeout forwarding/manifest/default assertions failed. GREEN — focused suite passed 13/13 and full suite passed 64 run, 1 skipped. CLI help, documentation command audit, `git diff --check`, and external fixture clean check also passed. No inference was run for this correction.
  - Live rehearsal: the isolated server at `http://127.0.0.1:11435` was started with `OLLAMA_HOST=127.0.0.1:11435` and `OLLAMA_NO_CLOUD=1`; startup output recorded cloud disabled and Ollama `0.30.11`. The first pilot after the timeout correction, `qwen3.5:4b`, exited 2 because its response was not valid JSON; this was not counted as a successful run. A subsequent explicit `qwen3:8b` run succeeded structurally with `--ollama-timeout-seconds 120`. Its exact digest was `500a1f067a9f782620b40bee6f7b0c89e17ae61f686b92c24933e4ca4b2b8b41`; manifest run ID `0b61ee89-41f3-4fd8-b99c-637b33943d15`; path `.pudu-ai/pycon-demo/0b61ee89-41f3-4fd8-b99c-637b33943d15.json`; manifest SHA-256 `8854a9534adcfa66207d151b5cab4bf864300bd84b7b030a658f3d48916782aa`.
  - Live telemetry/validation: application wall latency `84075 ms`; observed Ollama `prompt_tokens=1732`, `completion_tokens=1095`, `total_duration=84050183583 ns`, `load_duration=8077618583 ns`, and `eval_duration=67080778000 ns`. Manifest validation was `structurally_valid` with `factual_correctness_checked=false`. Evidence, prompt, and response were persisted only as hashes and byte counts; their bodies were not included.
  - Model-selection caveat: `qwen3:8b` was an explicit successful pilot, not a quality winner or recommendation. Pudu's recommendation remained `needs_selection`; this rehearsal supplies no comparative quality evidence.
  - Completion/rollback: PTD-008 implementation/fix commits are `2b96299` (isolated endpoint), `0bff96b` (operator-documentation correction), and `f1adf62` (bounded timeout). This is a tracker-only closure work unit; reverting it restores the prior pending status without removing implementation or runtime evidence. Delivery strategy remains `auto-chain` / `stacked-to-main`; this local work is not pushed and no PR was opened.

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
| PTD-008 | Complete | `2b96299`, `0bff96b`, `f1adf62` | Strict TDD correction focused 13/13; full suite 64 run, 1 skipped; live isolated-server rehearsal succeeded structurally with `qwen3:8b`, manifest SHA-256 `8854a9534adcfa66207d151b5cab4bf864300bd84b7b030a658f3d48916782aa`; first `qwen3.5:4b` attempt failed JSON validation. CLI/docs/diff/fixture checks passed. | Explicit successful pilot only; no model-quality winner claim; `needs_selection` remains |

## Capability boundary

Pudu can locate literal references, inspect Python AST structure, extract direct edges, and query candidate relationships. It cannot yet prove complete runtime impact across dynamic registries, late binding, generated mappings, or native extensions. The presentation must keep those boundaries visible rather than hiding them behind an LLM summary.

## External synchronization

- Kingston Pudu checkout is synchronized on `codex/pycon-ollama-local-only`; PTD-008 implementation and live evidence through `b548bbf` are present.
- Pinned Transformers fixture remains clean at `18329f1065382e54db698e242cf98bd3f3e5a766` (`v5.20.2`).
- Ignored MP4 copied to the external worktree and verified as SHA-256 `16d4295188f1fca85bbaa11e1b7e116c70261d9617f971d1340f5fcd7d4e26d3`.
- The redacted live manifest is preserved at `.pudu-ai/pycon-demo/0b61ee89-41f3-4fd8-b99c-637b33943d15.json` with SHA-256 `8854a9534adcfa66207d151b5cab4bf864300bd84b7b030a658f3d48916782aa`; it remains ignored and is not part of Git history.
- No branch was pushed and no pull request was opened.

## Next step

PTD-008 is complete, including the isolated live rehearsal and Kingston synchronization. Preserve `auto-chain` / `stacked-to-main` for any later delivery planning. Push and pull-request creation remain separate actions and require explicit authorization.
