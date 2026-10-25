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

- [ ] **PDW-002 — Build the Spanish presentation interface**
  - Route: delegated (HTML, CSS, JavaScript, accessible interaction, and deterministic artifact rendering).
  - Add a responsive presentation-led UI that explains search → AST → graph → bounded evidence → local model → verification; shows confirmed/inferred/unresolved boundaries; embeds or links the existing video/runbook/report; and drives only the narrow local API.
  - Acceptance: no remote assets or CDNs; keyboard-usable controls; visible running/error/completed states; no claim equates structural JSON validity with factual correctness.
  - Forecast: 220–360 authored lines.

- [ ] **PDW-003 — Document, rehearse, and verify the complete web demo**
  - Route: delegated verification and documentation.
  - Update the Spanish runbook and root quick path with exact launch, Ollama preflight, browser flow, fallback path, and shutdown instructions.
  - Acceptance: focused and full Python tests pass; static assets and local links resolve; browser QA exercises explanation, preflight, safe fake-run flow, responsive layout, and accessibility basics; pinned fixture remains clean; final local commits and rollback boundaries are recorded.
  - Forecast: 100–180 authored lines.

## Progress and evidence

| Task | Status | Commit | Verification | Review state |
|---|---|---|---|---|
| PDW-001 | Complete (hardened) | `91163e7adac344c908437abea8fa35a615da20d5` + hardening commit to be recorded | Correction RED reproduced; GREEN and full verification recorded below | RDD disabled/unmanaged |
| PDW-002 | Planned | — | Pending UI/browser checks | RDD clone-local state to be verified before delivery assessment |
| PDW-003 | Planned | — | Pending complete rehearsal | RDD clone-local state to be verified before delivery assessment |

## Route evidence

Repository exploration required more than four files and found no existing Python web runtime or framework dependency. A delegated mapping established that a stdlib loopback server is sufficient and that the current synchronous Ollama flow requires explicit progress callbacks for honest stage updates.

## PDW-001 evidence

- **Route:** delegated writer; this is a multi-file, security-sensitive API addition. Repository mapping found no existing web runtime. `tgrep` was unavailable, so the bounded exploration used direct inspection of the existing demo and its tests instead.
- **Original TDD:** RED — focused tests failed to import `pudu_agent.pycon_web`; GREEN — original 9 API tests and 15 existing demo tests passed; REFACTOR — original path/URL projection cleanup was followed by the 75-test full suite.
- **Correction TDD:** RED — `PYTHONPATH=python python3 -m unittest python.tests.test_pycon_web -v` reproduced exposed model secrets (3 test failures), and missing manifest/asset routes (6 test errors), for `FAILED (failures=3, errors=6)`. GREEN — 14 focused API tests pass, including secret-like key/value, POSIX/Windows paths, nested/oversized output, generic exception errors, UUID manifest confinement, symlink/size rejection, and allowlisted assets. REFACTOR — bounded recursive projection, UUID parsing, nonblocking no-follow file reads, and fixed routes passed the focused and full suites.
- **Routes:** `GET /api/manifests/<canonical-uuid>` only reads `.pudu-ai/pycon-demo/<uuid>.json`; `GET /api/presentation/report.json`, `/api/presentation/report.md`, `/api/presentation/runbook.es.md`, `/api/presentation/captions.es.vtt`, and `/api/presentation/video.mp4` are the complete static allowlist. All file reads are bounded, regular-file-only, and use no-follow directory/file descriptors. The MP4 route is available, but this checkout does not contain its artifact and thus returns 404 until the separately verified local MP4 exists.
- **Verification:** `PYTHONPATH=python python3 -m unittest python.tests.test_pycon_web -v` — PASS, 14 tests; `PYTHONPATH=python python3 -m unittest python.tests.test_transformers_ollama_demo -v` — PASS, 15 tests; `PYTHONPATH=python python3 -m unittest discover -s python/tests -v` — PASS, 80 tests, 1 expected live-Ollama skip; `PYTHONPATH=python python3 -m pudu_agent.pycon_web --help` — PASS; `git diff 56ea823 --check` — PASS; `git -C /Volumes/KINGSTON/pudu-pycon-2026/transformers status --porcelain` — PASS, clean output. No live Ollama or inference was used; runtime harness is intentionally N/A because it would touch shared local service state.
- **Commit and rollback relationship:** original implementation `91163e7adac344c908437abea8fa35a615da20d5`; original task-evidence follow-up `d7d7623` predates these findings and does not establish the corrected behavior. The hardening implementation commit and its task-evidence follow-up are pending below. To remove the implemented API, revert the hardening implementation and then the original implementation; neither source revert removes the separate task-evidence records, which must be revised or reverted independently.
- **Authored changed lines:** original implementation 473 additions plus deletions; hardening correction count will be recorded after staging. No generated artifacts.
- **RDD:** clone-local disabled; delivery state is disabled/unmanaged. No review lifecycle started.

## Next step

Implement PDW-002, keeping the UI limited to the fixed local API and preserving the structural-validity/factual-correctness distinction.
