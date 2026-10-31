# PyCon coherence fixes

## Objective

Close the coherence gaps found by the 2026-10-31 read-only audit so the repository, demo assets, and runbook tell one consistent PyCon 2026 story.

## Problem and why

- The deterministic evidence, numbers, and hashes are consistent, but the presentation layer has gaps that can fail or embarrass a live demo.
- The pinned fixture path is an exact-equality check hardcoded to one mount point; `pycon_web` has no way to override it.
- The rendered video and captions contain regional voseo ("Validá") while the demo copy is neutral Spanish.
- The runbook reports a stale Python test count (45 vs. 98 observed).
- The README entry point does not lead to the talk, and README.es.md does not mention it.

## Scope

- In: fixture-root override, neutral Spanish takeaway with re-rendered MP4 and updated hash, runbook count refresh, README PyCon entry (EN/ES), local dependency installation (no commit; `node_modules` is ignored).
- Out: Python packaging, CI changes, old Agent Lab video/captions cleanup, "600+" claim sourcing, PDW-005 visual QA, other polish items.

## Constraints

- Keep the exact-equality fixture check; only the expected root becomes configurable.
- Do not modify the Transformers fixture or the committed evidence snapshots.
- Generated artifacts in English; demo copy in neutral Spanish.
- RDD: off (clone-local) — no native review.
- TDD: enabled (session config, Strict TDD Mode). Runner: `PYTHONPATH=python python3 -m unittest` (pytest not installed); Remotion: `npm test` (vitest) in `docs/demos/pycon-2026/remotion`.

## Tasks

- [x] PCF-001 — Allow overriding the pinned fixture root with `PUDU_TRANSFORMERS_FIXTURE`; document it in the runbook. Route: inline (2 small files + doc, already understood). Commit `aa3c303`.
- [x] PCF-002 — Replace "Validá" with neutral "Valide" in the Remotion timeline, component, and VTT; re-render the MP4; update its SHA-256 in the runbook. Route: inline (mechanical text edits + render). Commit `3112203`.
- [x] PCF-003 — Refresh observed test counts in the runbook. Route: inline (mechanical). Commit `e224e89`.
- [x] PCF-004 — Add a visible PyCon 2026 entry to README.md and README.es.md. Route: inline (two short doc sections). Commit `fca13dd`.

## Acceptance criteria

- Python suite passes, including a new test for the override; default behaviour unchanged.
- `rg 'Validá'` returns nothing under `docs/demos/pycon-2026` (excluding `node_modules`).
- Runbook MP4 hash equals `shasum -a 256` of the re-rendered file; Remotion tests and typecheck pass.
- Both READMEs link to the runbook near the top.

## Progress and evidence

- Pre-step: `npm ci` in the repository root and in `docs/demos/pycon-2026/remotion` (exit 0).
- PCF-001: RED observed (3 errors, missing `resolve_fixture_root`); GREEN with the full Python suite at 101 tests, OK (skipped=1). Override smoke check: an absolute path is honoured, a relative path raises `ValueError`, and the default is unchanged when unset.
- PCF-002: RED observed (1 failed, 11 passed); GREEN 12/12; typecheck passed. The bundled headless shell fails with `Target closed` in this environment, while system Chrome lists both compositions. Re-rendered with system Chrome: H.264, 1920x1080, 30/1, 90 s, SHA-256 `485fa4edfab28ce5ce39d16c6b9c982811fa50a59a98052f0c4e092e57eb4c00`. Takeaway frame compared visually with the previous render: only the verb changed. The previous MP4 backup was kept outside the repository.
- PCF-003: commands run exactly as documented give focused 8/8 and suite 101 OK (skipped=1); Remotion 12/12.
- PCF-004: link targets exist; root `npm test` 73/73; typecheck passed.
- RDD: off (clone-local); no review assessment run.

## Next step

Merge `codex/pycon-demo-web` into `main` (user request). Remaining out-of-scope follow-ups: old Agent Lab video/captions and Remotion README, "600+" claim sourcing, PDW-005 visual QA, Python packaging/CI, "Tu navegador" register.
