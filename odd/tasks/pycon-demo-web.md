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
  - Acceptance: strict TDD covers loopback binding, Host/Origin checks, body/output/event limits, exact model allowlisting, single-run exclusion, traversal rejection, stage order, and failure states with fake clients only. **Observed:** API binds literal `127.0.0.1`; fixed GET routes expose preflight/models/run status/bounded events; POST accepts only exact installed tag+digest; mutations validate Host and reject mismatched Origin; request body cap is 4 KiB; event buffer is 100 entries; result cap is 16 KiB; error/event text is bounded; one run is active at a time. Manifest exposure is reduced to its basename. The demo invokes Python directly and receives additive progress callbacks; existing callers remain compatible.
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
| PDW-001 | Complete | `91163e7adac344c908437abea8fa35a615da20d5` | Strict TDD RED observed (missing module/import failure); GREEN and refactor verified by focused and full suites below | RDD disabled/unmanaged |
| PDW-002 | Planned | — | Pending UI/browser checks | RDD clone-local state to be verified before delivery assessment |
| PDW-003 | Planned | — | Pending complete rehearsal | RDD clone-local state to be verified before delivery assessment |

## Route evidence

Repository exploration required more than four files and found no existing Python web runtime or framework dependency. A delegated mapping established that a stdlib loopback server is sufficient and that the current synchronous Ollama flow requires explicit progress callbacks for honest stage updates.

## PDW-001 evidence

- **Route:** delegated writer; this is a multi-file, security-sensitive API addition. Repository mapping found no existing web runtime. `tgrep` was unavailable, so the bounded exploration used direct inspection of the existing demo and its tests instead.
- **TDD:** RED — `PYTHONPATH=python python3 -m unittest python.tests.test_pycon_web -v` failed at import with `ModuleNotFoundError: No module named 'pudu_agent.pycon_web'`. GREEN — implemented the API and callback contract; focused web API tests passed (9 tests), then existing demo tests passed (15 tests). REFACTOR — path and URL redaction, manifest basename projection, and boundary cleanup were followed by the same focused checks and full suite.
- **Verification:** `PYTHONPATH=python python3 -m unittest python.tests.test_pycon_web -v` — PASS, 9 tests; `PYTHONPATH=python python3 -m unittest python.tests.test_transformers_ollama_demo -v` — PASS, 15 tests; `PYTHONPATH=python python3 -m unittest discover -s python/tests -v` — PASS, 75 tests, 1 expected live-Ollama skip; `PYTHONPATH=python python3 -m pudu_agent.pycon_web --help` — PASS; `git diff --check` — PASS; `git -C /Volumes/KINGSTON/pudu-pycon-2026/transformers status --porcelain` — PASS, clean output. No live Ollama or inference was used; the runtime harness is intentionally N/A for this API unit because testing it would invoke shared local service state.
- **Rollback boundary:** revert commit `91163e7adac344c908437abea8fa35a615da20d5`; it removes only the loopback API, its API tests, and the optional callback/digest-check extension with its regression tests. It does not change the pinned Transformers fixture, Ollama daemon, or later UI/docs tasks.
- **Authored changed lines:** 473 additions plus deletions (468 insertions, 5 deletions in the work-unit commit; all are source, tests, or task evidence; no generated artifacts). The security-boundary tests and task evidence justify exceeding the 400-line planning heuristic; no tests or security checks were cut.
- **RDD:** clone-local disabled; delivery state is disabled/unmanaged. No review lifecycle started.

## Next step

Implement PDW-002, keeping the UI limited to the fixed local API and preserving the structural-validity/factual-correctness distinction.
