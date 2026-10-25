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

- [ ] **PDW-001 — Add safe web orchestration and loopback API**
  - Route: delegated (multiple non-trivial Python files and security-sensitive server behavior).
  - Add a stdlib local server with fixed routes for preflight, installed models, single-run start/status/events, redacted manifests, and presentation assets.
  - Reuse the existing demo through direct Python calls and explicit progress callbacks; do not expose subprocess or shell execution.
  - Acceptance: strict TDD covers loopback binding, Host/Origin checks, body/output/event limits, exact model allowlisting, single-run exclusion, traversal rejection, stage order, and failure states with fake clients only.
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
| PDW-001 | Planned | — | Pending strict TDD | RDD clone-local state to be verified before delivery assessment |
| PDW-002 | Planned | — | Pending UI/browser checks | RDD clone-local state to be verified before delivery assessment |
| PDW-003 | Planned | — | Pending complete rehearsal | RDD clone-local state to be verified before delivery assessment |

## Route evidence

Repository exploration required more than four files and found no existing Python web runtime or framework dependency. A delegated mapping established that a stdlib loopback server is sufficient and that the current synchronous Ollama flow requires explicit progress callbacks for honest stage updates.

## Next step

Implement PDW-001 with strict TDD, keeping all runtime calls fake/offline during tests.
