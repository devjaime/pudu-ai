# PyCon local demo web

Build a local-only presentation web that explains and safely executes the existing PyCon Transformers/Ollama demo without exposing arbitrary commands, paths, or service controls.

## Objective

Provide one browser-led narrative for the talk: understand the deterministic evidence, inspect the bounded state progression, choose a verified installed local model, execute the existing analysis, and review redacted results and telemetry.

## Problem

The current CLI, runbook, manifest, and video are individually reproducible, but a live talk still requires switching between terminals and files. The website must coordinate those artifacts while preserving the CLI's security and evidence boundaries.

## Authorized scope

- Edit only this Pudu-AI worktree.
- Treat `/Volumes/KINGSTON/pudu-pycon-2026/transformers` as a read-only pinned fixture.
- Reuse the existing `transformers_ollama_demo` behavior and already-installed Ollama models only.
- Do not pull models, start or stop Ollama, alter the shared daemon, push branches, open pull requests, or publish a hosted website.
- Local work-unit commits are authorized.

## Constraints and conventions

| Topic | Decision |
|---|---|
| Runtime | Python standard library HTTP server plus static HTML/CSS/JavaScript; no new web framework dependency |
| Binding | Literal loopback only; default `127.0.0.1` |
| Execution | Direct Python calls only; no shell, arbitrary command, path, or environment execution |
| Fixture | Exact pinned Transformers root, tag `v5.20.2`, commit `18329f1065382e54db698e242cf98bd3f3e5a766` |
| Model selection | Browser chooses only from refreshed installed tag+digest records; exact selected identity is revalidated before execution |
| Concurrency | At most one active analysis run; event history and output are bounded |
| Evidence | Structural validity and telemetry are displayed; factual correctness and model quality remain unproven |
| Language | Professional neutral Spanish presentation copy; code and developer documentation in English |
| TDD | Strict RED → GREEN → REFACTOR |
| Python runner | `PYTHONPATH=python python3 -m unittest discover -s python/tests -v` |
| Delivery strategy | `auto-chain` |
| Chain strategy | `stacked-to-main` |

## Tasks

- [x] **PDW-001 — Add safe web orchestration and loopback API**
  - Route: delegated (multiple non-trivial Python files and security-sensitive server behavior).
  - Add a stdlib local server with fixed routes for preflight, installed models, single-run start/status/events, redacted manifests, and presentation assets.
  - Reuse the existing demo through direct Python calls and explicit progress callbacks; do not expose subprocess or shell execution.
  - Acceptance: strict TDD covers loopback binding, Host/Origin checks, body/output/event limits, exact model allowlisting, single-run exclusion, traversal rejection, stage order, and failure states with fake clients only. **Observed:** API binds literal `127.0.0.1`; fixed GET routes expose preflight/models/run status/bounded events; POST accepts only exact installed tag+digest; mutations validate Host and reject mismatched Origin; request body cap is 4 KiB; event buffer is 100 entries; result cap is 16 KiB; model result strings and manifests are recursively redacted/projected; public failures use stable generic text; one run is active at a time. Manifest lookup is UUID-only and uses no-follow directory/file opens with a 64 KiB cap. Presentation routes are a fixed five-item allowlist for report JSON/Markdown, Spanish runbook, Transformers captions, and MP4, with per-file caps and no-follow access. The demo invokes Python directly and receives additive progress callbacks; existing callers remain compatible.
  - Forecast: 220–340 authored lines.

- [x] **PDW-002 — Build the Spanish presentation interface**
  - Route: delegated (HTML, CSS, JavaScript, accessible interaction, and deterministic artifact rendering).
  - Add a responsive presentation-led UI that explains search → AST → graph → bounded evidence → local model → verification; shows confirmed/inferred/unresolved boundaries; embeds or links the existing video/runbook/report; and drives only the narrow local API.
  - Acceptance: no remote assets or CDNs; keyboard-usable controls; visible running/error/completed states; no claim equates structural JSON validity with factual correctness. **Observed:** dependency-free Spanish interface loads the deterministic report, presents the six-stage progression and explicit evidence-status boundaries, and uses fixed loopback routes only. The optional local run requires a ready preflight and an exact installed tag+digest; its bounded event/status polling renders server-projected findings, redaction and the structural-validity/factual-correctness boundary, with a UUID manifest link when present. Fixed runbook/report/captions links and the existing MP4 route are exposed; a missing video shows an honest fallback.
  - Forecast: 220–360 authored lines.

- [x] **PDW-003 — Document, rehearse, and verify the complete web demo**
  - Route: delegated verification and documentation.
  - Update the Spanish runbook and root quick path with exact launch, Ollama preflight, browser flow, fallback path, and shutdown instructions.
  - Acceptance: focused and full Python tests pass; static assets and local links resolve; browser QA exercises explanation, preflight, safe fake-run flow, responsive layout, and accessibility basics; pinned fixture remains clean; final local commits and rollback boundaries are recorded.
  - Forecast: 100–180 authored lines.

## Progress and evidence

| Task | Status | Commit | Verification | Review state |
|---|---|---|---|---|
| PDW-001 | Complete (hardened) | `91163e7adac344c908437abea8fa35a615da20d5` + `b1306785164a5309da74bf945f0c5d6ac875fd3d` + `ab5b688f90b2d8899f053e62880e3eefdf83d6a1` | Path-redaction RED reproduced and GREEN/full verification recorded below; this tracker update is the path-correction task-evidence follow-up | RDD disabled/unmanaged |
| PDW-002 | Complete (review correction applied) | `b0a0407` + `05807e1` + tracker evidence follow-ups | Latest: 22 focused UI/API tests, 2 Node state tests, 15 demo tests, full suite 88 passed (1 expected live-Ollama skip); syntax, CLI help, diff check and fixture cleanliness passed | RDD clone-local disabled/unmanaged |
| PDW-003 | Complete | `bdb4d09` + `3a59027` + `be85550` + final evidence follow-up | 29 focused tests, 2 Node tests, full suite 95 passed (1 expected live-Ollama skip), desktop/mobile browser QA, clean console, and one completed isolated `qwen3:8b` run | RDD clone-local disabled/unmanaged |

## Route evidence

Repository exploration required more than four files and found no existing Python web runtime or framework dependency. A delegated mapping established that a stdlib loopback server is sufficient and that the current synchronous Ollama flow requires explicit progress callbacks for honest stage updates.

## PDW-001 evidence

- **Route:** delegated writer; this is a multi-file, security-sensitive API addition. Repository mapping found no existing web runtime. `tgrep` was unavailable, so the bounded exploration used direct inspection of the existing demo and its tests instead.
- **Original TDD:** RED — focused tests failed to import `pudu_agent.pycon_web`; GREEN — original 9 API tests and 15 existing demo tests passed; REFACTOR — original path/URL projection cleanup was followed by the 75-test full suite.
- **Correction TDD:** RED — `PYTHONPATH=python python3 -m unittest python.tests.test_pycon_web -v` reproduced exposed model secrets (3 test failures), and missing manifest/asset routes (6 test errors), for `FAILED (failures=3, errors=6)`. GREEN — 14 focused API tests pass, including secret-like key/value, POSIX/Windows paths, nested/oversized output, generic exception errors, UUID manifest confinement, symlink/size rejection, and allowlisted assets. REFACTOR — bounded recursive projection, UUID parsing, nonblocking no-follow file reads, and fixed routes passed the focused and full suites.
- **Routes:** `GET /api/manifests/<canonical-uuid>` only reads `.pudu-ai/pycon-demo/<uuid>.json`; `GET /api/presentation/report.json`, `/api/presentation/report.md`, `/api/presentation/runbook.es.md`, `/api/presentation/captions.es.vtt`, and `/api/presentation/video.mp4` are the complete static allowlist. All file reads are bounded, regular-file-only, and use no-follow directory/file descriptors. The MP4 route is available, but this checkout does not contain its artifact and thus returns 404 until the separately verified local MP4 exists.
- **Verification:** `PYTHONPATH=python python3 -m unittest python.tests.test_pycon_web -v` — PASS, 14 tests; `PYTHONPATH=python python3 -m unittest python.tests.test_transformers_ollama_demo -v` — PASS, 15 tests; `PYTHONPATH=python python3 -m unittest discover -s python/tests -v` — PASS, 80 tests, 1 expected live-Ollama skip; `PYTHONPATH=python python3 -m pudu_agent.pycon_web --help` — PASS; `git diff 56ea823 --check` — PASS; `git -C /Volumes/KINGSTON/pudu-pycon-2026/transformers status --porcelain` — PASS, clean output. No live Ollama or inference was used; runtime harness is intentionally N/A because it would touch shared local service state.
- **Path-correction TDD:** RED — `PYTHONPATH=python python3 -m unittest python.tests.test_pycon_web.TextSafetyTests -v` failed on UNC roots and final `.`/`..` components (5 assertion failures). GREEN — same command passed both tests; REFACTOR — the path regex now recognizes UNC roots without requiring a trailing separator, and relative-reference validation checks every component. The full focused and regression suites below pass.
- **Latest verification:** `PYTHONPATH=python python3 -m unittest python.tests.test_pycon_web -v` — PASS, 16 tests; `PYTHONPATH=python python3 -m unittest python.tests.test_transformers_ollama_demo -v` — PASS, 15 tests; `PYTHONPATH=python python3 -m unittest discover -s python/tests -v` — PASS, 82 tests, 1 expected live-Ollama skip; `PYTHONPATH=python python3 -m pudu_agent.pycon_web --help` — PASS; `git diff 56ea823 --check` — PASS; `git -C /Volumes/KINGSTON/pudu-pycon-2026/transformers status --porcelain` — PASS, clean output. No live Ollama or inference was used; runtime harness is intentionally N/A because it would touch shared local service state.
- **Commit and rollback relationship:** original implementation `91163e7adac344c908437abea8fa35a615da20d5`; original completion evidence `d7d7623` predates the verifier findings; hardening implementation `b1306785164a5309da74bf945f0c5d6ac875fd3d`; hardening evidence follow-up `4af754a`; path redaction correction `ab5b688f90b2d8899f053e62880e3eefdf83d6a1`; this tracker edit records that correction. To remove the API implementation, revert `ab5b688`, then `b130678`, then `91163e7`. This does not remove the related historical task-evidence commits `d7d7623`, `4af754a`, or this tracker follow-up; those document commits need separate revision/revert if desired. PDW-002/003 remain pending.
- **Authored changed lines:** original implementation 473 additions plus deletions; hardening correction 314 changed lines (290 insertions, 24 deletions); path correction 24 changed lines (21 insertions, 3 deletions in `ab5b688`). No generated artifacts.
- **RDD:** clone-local disabled; delivery state is disabled/unmanaged. No review lifecycle started.

## PDW-002 evidence

- **Route:** delegated writer; the presentation spans separate HTML, CSS, JavaScript, fixed API routes, and contract tests. The authored change is 417 lines, slightly above the planning heuristic; the cohesive interface and accessibility/safety tests were kept together rather than compressed or split artificially.
- **TDD:** RED — the initial run-state contract test failed with `ERR_MODULE_NOT_FOUND` because the factored stage/polling state module did not exist yet. GREEN — after implementing the stage-state mapper and injectable bounded poller, the Node behavior tests passed, including a zero-wait exhaustion→resume sequence for the same run ID. REFACTOR — integrated the helper into the UI, added the fixed module route and resume control, and verified live API route behavior and full regression tests.
- **Experience:** the talk-led page explains literal search → AST → graph → bounded evidence → local model → verification. The deterministic report supplies its real claims, stage records, repository revision/tag, and byte measurement; the interface distinguishes CONFIRMED, INFERRED, and UNRESOLVED and explicitly states the graph does not prove complete runtime impact. The run state has ready/blocked preflight, refreshed installed model inventory, exact tag+digest submission, bounded status/event polling, error/completed states, projected findings, and a redacted UUID manifest link. Static runbook/report/captions routes are linked; video 404 is handled with a fallback.
- **Verification:** `PYTHONPATH=python python3 -m unittest python.tests.test_pycon_web_ui python.tests.test_pycon_web -v` — PASS, 20 tests; `PYTHONPATH=python python3 -m unittest python.tests.test_transformers_ollama_demo -v` — PASS, 15 tests; `PYTHONPATH=python python3 -m unittest discover -s python/tests -v` — PASS, 86 tests, 1 expected live-Ollama skip; `node --check docs/demos/pycon-2026/web/app.js` — PASS; `PYTHONPATH=python python3 -m pudu_agent.pycon_web --help` — PASS; `git diff --check 188523f..HEAD` — PASS; pinned fixture status — clean. No live Ollama, model inference, or browser rehearsal was performed; browser/live walkthrough remains in PDW-003.
- **Commit/rollback:** initial interface and tests are in `b0a0407` (`feat(pycon): add presentation demo web`); the bounded run-state correction is in `05807e1` (`fix(pycon): preserve honest web run state`). Tracker evidence is recorded in separate follow-up commits. Revert `05807e1` to undo the correction; revert `b0a0407` as well to remove the interface and fixed routes. PDW-003 remains pending.
- **RDD:** clone-local disabled/unmanaged; no native review transaction was started.

### PDW-002 bounded review correction

- Corrected the independent-review findings in `05807e1` (`fix(pycon): preserve honest web run state`): deterministic stages now use their actual `VERIFIED` / `COMPLETED` / `NOT_RUN` state with a separate non-color-only stage label; `RUNTIME_TESTS` and `MODEL_ANALYSIS` display “No ejecutada · NOT_RUN”.
- A 300-query polling horizon now returns a pending outcome without discarding the run ID or clearing the active state. “Continuar consultando la corrida activa” polls the same ID. Only completed/failed status clears the active run; transient status-fetch errors keep the run resumable and block a fresh start.
- **RED/GREEN:** Node tests fail before implementation because `/web/run-state.mjs` is absent; after implementation, 2 Node behavior tests pass, including model/runtime `NOT_RUN` status and exhausted polling followed by same-ID terminal resume with injected zero-delay polling.
- **Verification:** focused UI/API tests — PASS, 22; Ollama demo regression — PASS, 15; full Python suite — PASS, 88 tests, 1 expected live-Ollama skip; Node run-state tests — PASS, 2; `node --check` for `app.js` and `run-state.mjs` — PASS; CLI help — PASS; `git diff --check 188523f..HEAD` — PASS; pinned fixture clean. No live Ollama or browser rehearsal was performed.
- **Rollback:** revert `05807e1` to restore the prior PDW-002 UI/run-state behavior. Reverting the full PDW-002 implementation additionally requires reverting `b0a0407`; this tracker update is recorded separately and PDW-003 remains pending.

## PDW-003 evidence

- **Route:** direct focused implementation in one work unit. The endpoint wiring is a bounded addition to the already-understood `pycon_web` entry point; docs and contract tests ship with that behavior.
- **TDD:** RED — the new CLI tests failed because `--ollama-url` was not recognized and default `DemoService` construction was not forwarded. GREEN — five endpoint tests pass: custom normalized `11435` reaches service and preflight, the default `11434` remains, invalid/non-loopback endpoints fail before service or bind, and help exposes the option. REFACTOR — reused the existing `validate_endpoint` canonicalizer; no new URL policy or endpoint handling path was added.
- **Documentation:** bilingual English/Spanish root quick paths now launch the web UI; the Spanish runbook covers separate Ollama and web terminals, model inventory/preflight, browser stages and expected results, manifest behavior, polling horizon, factual-correctness boundary, shutdown, video/report/runbook fallback, and direct CLI fallback. Documentation contract tests check exact commands and key local links/paths.
- **Work-unit commit:** `bdb4d09f80fc52bcf108b70bc8581df4c8f1af34` (`feat(pycon): document local demo web launch`). Rollback boundary: revert this commit to remove the CLI option, its tests, and the accompanying launch documentation; no fixture files or other behavior are changed.
- **Preparation verification:** focused UI/API/documentation suite — PASS, 29 tests; Ollama demo regression — PASS, 15 tests; full Python suite — PASS, 95 tests, 1 expected live-Ollama skip; Node run-state tests — PASS, 2; `node --check` on `app.js` and `run-state.mjs` — PASS; CLI help includes `--ollama-url`; documentation contract audit — PASS; `git diff --check c89c7c6..HEAD` — PASS; pinned Transformers fixture status — clean. The focused HTTP tests bind only `127.0.0.1`; their run required authorized loopback execution permission. This evidence was recorded before the later live/browser rehearsal below.
- **RDD:** clone-local disabled/unmanaged (`gentle-ai review mode status`); no review lifecycle was started.
- **Browser rehearsal:** the presentation loaded at `http://127.0.0.1:8766/`; port `8765` was already occupied by an unrelated process and was left untouched. Accessibility/DOM inspection confirmed the complete Spanish narrative, deterministic report, distinct `VERIFIED` / `COMPLETED` / `NOT_RUN` stage states, CONFIRMED / INFERRED / UNRESOLVED evidence labels, exact model identities, fixed presentation links, and the honest missing-video fallback. Desktop and `390x844` viewport screenshots showed a usable responsive layout. The browser console contained no warnings or errors.
- **Live local run:** an isolated `OLLAMA_NO_CLOUD=1` daemon listened only on `127.0.0.1:11435`; the shared daemon was not changed. The UI selected exact installed identity `qwen3:8b` / digest `500a1f067a9f782620b40bee6f7b0c89e17ae61f686b92c24933e4ca4b2b8b41` and completed run `4bc98f2c-00f7-4a65-ab05-2d961f5f4726`. Observed events progressed through queued, running, evidence, model, ollama, generation, validation, manifest, and completed. The UI kept the explicit warning that factual correctness was not verified; this mattered because the structurally valid model response claimed “600+” inheritors while the bounded deterministic evidence listed 8 candidates.
- **Manifest evidence:** `.pudu-ai/pycon-demo/4bc98f2c-00f7-4a65-ab05-2d961f5f4726.json` contains tag `v5.20.2`, revision `18329f1065382e54db698e242cf98bd3f3e5a766`, Ollama `0.30.11`, prompt/evidence/response hashes and byte counts, 1,732 prompt tokens, 1,095 completion tokens, and 83,576 ms application wall latency. It contains no prompt or response bodies and records `structurally_valid` with `factual_correctness_checked: false`.
- **Final verification:** the first sandboxed focused run failed only because loopback socket binding returned `EPERM`; the same required command was rerun with authorized local loopback access and passed. Focused UI/API/documentation suite — PASS, 29 tests; Node run-state tests — PASS, 2; JavaScript syntax — PASS; full Python suite — PASS, 95 tests with 1 expected live-Ollama skip; `git diff --check` — PASS; pinned Transformers fixture — clean.
- **Delivery state:** no model pull, fixture edit, hosted publication, push, or pull request occurred. The isolated web/Ollama processes are stopped after preserving the redacted manifest for the Kingston presentation checkout.

## Next step

The three implementation tasks are complete. Copy the ignored redacted rehearsal manifest into the Kingston presentation checkout, move the feature branch there, and use the documented two-terminal flow for the talk. Push and pull-request creation remain separate user decisions.
