# Interactive local-task worker diagram

## Objective
Create a Spanish-language interactive Archify diagram explaining the implemented local task worker, its boundaries, telemetry, returns, and limitations.

## Problem and rationale
The current diagram should teach what this version actually does without implying broader automation or guarantees. Curated interactive views should make the primary flow and trust boundaries understandable.

## Scope and constraints
- Update `docs/diagrams/local-task-worker-flow.json` and regenerate `docs/diagrams/local-task-worker-flow.html` with Archify `deliver`.
- Use only verified code-backed facts; preserve Spanish authored text and omit `meta.locale` (Viewer chrome fallback is English).
- Include task types, bounded read-only repository context, deterministic effort/model routing, loopback-only Ollama, structural verification, redacted local telemetry, structured returns, and explicit limitations.
- Do not edit generated HTML by hand; do not push or open a PR.
- TDD: N/A (passive documentation artifact); verification uses Archify showcase validation/delivery, canonical visual-check, visual inspection, and git checks.
- Route: delegated direct, because this multi-artifact update requires preparation across multiple implementation/code files and generated artifacts.
- Delivery strategy: `ask-on-risk`; forecast authored diff below 400 lines, generated HTML/evidence excluded from authored count.

## Acceptance criteria
1. Diagram and curated views accurately explain the local task worker and its limits in Spanish.
2. Showcase validation passes 9/9 with zero errors and warnings; `deliver` succeeds and its spec/artifact hashes match checked files.
3. Canonical visual-check passes required sizes/captures and screenshots receive perceptual inspection.
4. `git diff --check` passes; authored line count is recorded; coherent work-unit Conventional Commit is created.

## Tasks and progress
- [x] IW-1 Verified accepted task kinds, bounded context defaults, local-only model route, structural verifier, redacted telemetry, and structured protocol against implementation. Viewer chrome fallback is English because Spanish `meta.locale` is unsupported.
- [x] IW-2 Revised the JSON source with three curated views and clearer cards; regenerated HTML only through `deliver`.
- [x] IW-3 Final showcase validation passed 9/9, 0 errors/warnings; `visual-check` passed all four required sizes with no overflow; inspected light/dark screenshots at 1440×900 and 2048×1320; `git diff --check` passed. Authored line count: 193 (JSON source 152 additions+deletions; tracker 41 additions; generated HTML/screenshots excluded). Update checker ran once: installed 2.17.0-dev.1, latest 3.0.1 (normal); user notified; skill unchanged.
- [ ] IW-4 Re-read this tracker and commit the completed work unit.

## Evidence
- Progress: IW-1 and IW-2 complete. Branch: `codex/interactive-worker-diagram`.
- Viewer chrome and `<html lang>` fall back to English; authored diagram is Spanish and omits `meta.locale`.
- First successful validate: 9/9 showcase checks, 0 errors, 0 warnings.
- Delivery: spec SHA-256 `d2a5e4d4538d4dfb9efae53f4fcb7a9d29d85c817bed96bdfcb91fe56229d610`; HTML SHA-256 `ab318b2bc8aa083a5644ea11951ef07f1717c104ea2ec8365258af521d0136fd`; 9/9 checks, 0 errors/warnings.
- Browser evidence: `visual-check` passed; required 1440×900, 1600×1000, 1920×1080, 2048×1320 containment measurements pass; endpoint light/dark captures complete. Readability at 1440 has 7.75px minimum projected text.
- Perceptual review: inspected 1440×900 light/dark and 2048×1320 light/dark screenshots; composition readable, contained, no obvious crossings or clipping.
- Verification: final validation and whitespace checks passed.
- Commit: pending.

## Next step
Commit the complete diagram, generated browser evidence, and tracker as one work unit; then record the commit SHA.
