# PyCon Remotion demo video

## Objective
Create a self-contained 90-second, 1920×1080, 30fps, H.264, captions-only Spanish segment for the virtual PyCon talk “LLMs frente a repositorios gigantes: ASTs, grafos y CLIs para agentes que entienden código”.

## Problem and why
The talk needs a polished, reproducible demonstration of repository understanding that stays grounded in fixture and implementation evidence, without voiceover, network media, or a variable Ollama run.

## Scope
- Native Remotion composition and modular TypeScript/React sources under `docs/demos/pycon-2026/remotion/`.
- Burned-in high-contrast Spanish captions and Spanish WebVTT at `docs/demos/pycon-2026/captions.es.vtt`.
- Final MP4 at `docs/demos/pycon-2026/pycon-2026-agent-lab-demo.mp4`.
- Deterministic presentation of the public Python fixture, literal `validate_user` search, graph relationships, evidence boundaries, existing dark local-worker diagram, and closing CLI takeaway.
- Tests, typecheck, composition discovery, H.264 render/probe, sampled-frame visual inspection, VTT validation, and documentation of observed evidence.

## Out of scope
- Voiceover, online media, Stitch, live Ollama worker demo, invented graph edges, factual guarantees, or claiming variable execution time is fixed.
- Changes to the original dirty checkout, pushes, or pull requests.

## Constraints and authorized scope
- Work only in branch `codex/pycon-remotion-demo` at the managed worktree.
- Pin all Remotion packages to one exact version; use compatible exact React/ReactDOM, TypeScript, and Vitest versions.
- Capture actual deterministic fixture CLI outputs during implementation.
- Keep rendered MP4 uncommitted/ignored if repository hygiene requires it; source, manifest/captions, tests, docs, and lockfile should be committed coherently.
- No AI attribution in commit messages. Delivery strategy: `ask-on-risk`, resolved by explicit user selection of `stacked-to-main`; plan PR 1 for fixture evidence plus Remotion toolchain/source/tests/captions, then PR 2 for render verification assets/docs/tracker closeout if needed. Do not push or create PRs. Count authored lines excluding lockfile and generated media.

## Stable tasks and route
| ID | Task | Route and trigger evidence | Status |
|---|---|---|---|
| T1 | Capture fixture CLI evidence; pin toolchain; add timeline, caption manifest, and invariant tests | Delegated direct writer; preparation plus test-backed data/toolchain unit; slice 1 | Done |
| T2 | Implement Remotion composition and diagram pan/zoom; render and verify MP4; inspect frames; document final evidence | Delegated direct writer; composition + rendering/docs unit; slice 2 | In progress |


## Acceptance criteria
- [x] 2700 frames at 30fps (90 seconds), 1920×1080, H.264, no unexpected audio.
- [x] Storyboard timing: 0–7s title/thesis; 7–25s fixture and literal search; 25–45s graph query; 45–62s evidence boundary; 62–82s existing dark local-worker diagram pan/zoom; 82–90s CLI/takeaway.
- [x] Unit tests cover duration/frame math, legal transition math, ordered and contained caption cues, and required scene IDs/content.
- [x] Actual CLI outputs are captured; all factual claims distinguish observed evidence from presentation copy and do not promise variable timing.
- [x] Nested unit tests and typecheck pass; Remotion composition discovery succeeds; final render and ffprobe constraints pass.
- [x] Representative frames are visually inspected for clipping, contrast, caption legibility, asset fit, and scene progression; VTT ordering/end-time checks pass.
- [x] `git diff --check` passes; changed-file list, media size/hash, commit identity, authored line count, rollback boundary, and limitations are recorded.

## Strict TDD
Strict TDD is enabled by the repository's explicit AGENTS.md instruction. Exact runner: nested `npm test` (Vitest). Required order: RED (run target tests and record observed failure) → GREEN (minimal implementation and passing tests) → REFACTOR (clean modularization while preserving green tests). Do not infer RED/GREEN evidence.

## Verification commands
- `npm test`
- `npm run typecheck`
- `npm run compositions`
- `npm run render`
- `ffprobe -v error -show_entries format=duration -show_entries stream=codec_name,width,height,r_frame_rate,codec_type -of json docs/demos/pycon-2026/pycon-2026-agent-lab-demo.mp4`
- `ffmpeg` extract representative frames/contact sheet; visually inspect extracted image.
- Check VTT cue order and final end time of 90 seconds.
- `git diff --check`

## Progress and verification
- Package and RED-test harness files were created before the parent delivered the chain-strategy response; no composition implementation had started at that point. The strategy is now explicitly resolved as stacked-to-main.
- Exploration confirmed the clean managed worktree, Python fixture files, existing local worker diagram, root CLI scripts, and that Remotion is not yet configured.
- Prior mapped project evidence: Node 26.4, npm 11.17, ffmpeg 8.1.2, Python 3.14.6; the fixture path is `tests/fixtures/repos/python-small`.
- Strict-TDD RED observed: `cd docs/demos/pycon-2026/remotion && npm test -- --reporter=dot` failed because `src/timeline.js` does not exist yet (one suite failed at import).
- Actual fixture search: `rg` strategy, 4 matches at `notes.txt:2`, `auth.py:1`, `auth.py:7`, and `auth.py:12`; measured duration observed 94 ms (variable, not fixed evidence).
- Actual fixture graph: `python-ast` backend, 8 nodes, 9 edges; two resolved calls point from `authenticate` and `UserService.check` to `validate_user`; duration observed 1 ms (variable).
- Nested package pins: Remotion, @remotion/cli, and @remotion/transitions `4.0.537`; React/ReactDOM `18.3.1`; Vitest `3.2.7`; TypeScript `5.9.3`; zod `4.5.4` to match Remotion.
- GREEN observed: `npm test -- --reporter=dot` passes 5 tests; `npm run typecheck` passes.
- Remotion composition discovery lists `PyConAgentLab` at 30fps, 1920×1080, 2700 frames (90s). Remotion installed its Chrome Headless Shell for rendering.
- Final render completed with H.264/concurrency 4. ffprobe: H.264 video, 1920×1080, 30/1 fps, 2700 frames, 90.000 seconds, no audio stream. Size: 11,603,273 bytes. SHA-256: 22f18a46a1cd936c174a719dc97547e2eb066afe7d164b3679f185e30497a3ae. MP4 is intentionally ignored at the requested local path.
- VTT check passed: 11 ordered, non-overlapping cues; final cue ends 00:01:30.000.
- Final contact sheet and three worker-pan samples visually reviewed; scene progression, safe margins, contrast, caption legibility, and all primary diagram nodes were present. The pan viewport was adjusted after the first review showed side/bottom clipping; final inspected still fits the full primary flow.
- git diff --check passed.
- Slice 1 commit: 1f0d72195e6a3b9149fb12f493ca78b6c711c42e (feat(pycon): add deterministic demo timeline contract), 292 authored added lines excluding generated package-lock; files: tracker, VTT, package manifest, tsconfig, Vitest config, timeline, and tests. This is intended PR 1. Rollback boundary: reverting this commit removes the demo toolchain contract, timeline/captions, tests, and tracker; the render-composition slice is not committed yet.
- Slice 2 is intended PR 2 in stacked-to-main order and will add composition, local diagram asset, render documentation, MP4 ignore rule, and closeout evidence. Forecast approximately 400 authored additions/deletions excluding generated lock, MP4, and copied PNG; exact count and SHA pending. Do not push or create PRs.

## Next step
Slice 1 is committed locally. Next, add composition entry/source, diagram asset, render README and ignore rule; rerun checks and commit slice 2, record its exact SHA/count and rollback boundary, and leave push/PR decisions to the user.
