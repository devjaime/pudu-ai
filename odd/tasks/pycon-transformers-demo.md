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

- [ ] **PTD-005 — Extend the Ollama client contract**
  - Route: delegated (client behavior and tests span multiple non-trivial files).
  - Preserve model tag and digest from `/api/tags`, capture the Ollama server version when available, and support explicit JSON formatting plus controlled generation options.
  - Acceptance: strict TDD observes RED then GREEN; requests include only allow-listed reproducibility options; existing callers remain compatible; client tests cover malformed and missing runtime metadata.
  - Forecast: 140–240 authored lines.

- [ ] **PTD-006 — Add the interactive reproducible Ollama demo**
  - Route: delegated (new orchestration, validation, persistence, CLI UX, and tests).
  - Feed only the bounded deterministic Transformers evidence into a versioned prompt and JSON contract. Add interactive installed-model selection and automatic mode with an explicit model selector.
  - Persist an atomic redacted run manifest under ignored `.pudu-ai/pycon-demo/` containing fixture, evidence, prompt/schema, model/runtime, options, telemetry, validation, and response hashes without storing full evidence or response by default.
  - Acceptance: strict TDD observes RED then GREEN; offline/fake-client tests cover success and failures; repeated fixture preparation is byte-stable; no model output is executed or promoted to factual proof.
  - Forecast: 260–400 authored lines.

- [ ] **PTD-007 — Document and rehearse the one-command workflow**
  - Route: delegated (cross-checks executable commands, generated manifest, and presentation narrative).
  - Add one automatic command and one interactive command to the Spanish runbook. Preserve the existing deterministic `MODEL_ANALYSIS: NOT_RUN` snapshot as the no-model baseline and explain that live Ollama runs create separate ignored manifests.
  - Acceptance: commands and paths exist; deterministic tests and a fake-runtime rehearsal pass; a live run is attempted only when an already-running Ollama server and installed model are available; limitations state that temperature zero and a fixed seed do not guarantee identical text across runtimes.
  - Forecast: 100–180 authored lines.

## Progress and evidence

| Task | Status | Commit | Verification | Review state |
|---|---|---|---|---|
| PTD-001 | Complete | `4df6d9a` | Focused 5/5; full Python suite 42 run, 1 skipped; two CLI runs byte-identical (6,808 bytes); nested-root rejection; fixture clean; independent verifier PASS | RDD disabled/unmanaged; risk assessment unassessable because files were initially untracked, treated as high and independently verified |
| PTD-002 | Complete | `27448a6` | Focused 3/3; full Python suite 45 run, 1 skipped; JSON and Markdown reproduced byte-identically and matched snapshots; 99.55% byte reduction independently recalculated | RDD disabled/unmanaged; untracked assessment treated as high and independently verified PASS |
| PTD-003 | Complete | `ecce5f2`, `a1f2f5e` | Tests 11/11; typecheck; two compositions discovered; 1920×1080/30 fps/90 s H.264 render; VTT/scene alignment; visual inspection; SHA-256 `16d4295188f1fca85bbaa11e1b7e116c70261d9617f971d1340f5fcd7d4e26d3` | RDD disabled/unmanaged; high/unassessable candidate independently verified PASS; delivered as 140-line and 75-line stacked units |
| PTD-004 | Complete | `2e48c82` | Runbook link audit 15/15; Python suite 45 run, 1 skipped; reports reproduce exactly; Remotion 11/11, typecheck, two compositions; MP4 checksum/ffprobe; fixture clean | Independent verifier unavailable because the delegated account hit its usage limit; parent completed structural readback and all applicable deterministic checks |
| PTD-005 | Pending | — | TDD not started | Awaiting implementation |
| PTD-006 | Pending | — | TDD not started | Awaiting PTD-005 |
| PTD-007 | Pending | — | Not started | Awaiting executable workflow |

## Capability boundary

Pudu can locate literal references, inspect Python AST structure, extract direct edges, and query candidate relationships. It cannot yet prove complete runtime impact across dynamic registries, late binding, generated mappings, or native extensions. The presentation must keep those boundaries visible rather than hiding them behind an LLM summary.

## External synchronization

- Kingston Pudu worktree fast-forwarded through `47157ab` on `codex/pycon-transformers-demo`.
- Pinned Transformers fixture remains clean at `18329f1065382e54db698e242cf98bd3f3e5a766` (`v5.20.2`).
- Ignored MP4 copied to the external worktree and verified as SHA-256 `16d4295188f1fca85bbaa11e1b7e116c70261d9617f971d1340f5fcd7d4e26d3`.
- No branch was pushed and no pull request was opened.

## Next step

Implement PTD-005 with strict TDD, then continue through the Ollama demo and runbook work units. Push or pull-request creation still requires explicit authorization.
