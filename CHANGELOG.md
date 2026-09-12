# Changelog

## Unreleased

### Added

- Pudu Agent Lab spec and `pudu-ai repo search` (rg + ast-grep via Python JSON protocol)
- Docs in English and Spanish: `docs/spec/agent-lab.md`, `docs/spec/agent-lab.es.md`, `docs/agent-lab-usage.md`, `docs/agent-lab-usage.es.md`, `README.es.md`

## 0.2.19 — 2026-09-07

### Fixed

- `launch --yes` no longer hangs on full catalog load; OpenCode inherits the terminal

## 0.2.18 — 2026-09-07

### Fixed

- CI typecheck TS1355 on task origin union

## 0.2.17 — 2026-09-07

### Added

- Setup hub: [5] brew install ollama, [6] brew install --cask lm-studio, [4] Docker, [1-3] agents

## 0.2.16 — 2026-09-07

### Fixed

- Docker [4]: brew install --cask docker if needed, start Docker Desktop, then run ollama container

## 0.2.15 — 2026-09-07

### Added

- Docker as a runtime option: detect, install hint, or [4] `docker run ollama/ollama`

## 0.2.14 — 2026-09-07

### Added

- [C] explains how compare works; missing Ollama / LM Studio / OpenCode / Hermes / OpenClaw show install commands

## 0.2.13 — 2026-09-07

### Added

- Typewriter cursor for brand line and on-screen explanations

## 0.2.12 — 2026-09-07

### Fixed

- [R] lists recommendations only; [S] is Setup (install + agents)

## 0.2.11 — 2026-09-07

### Changed

- Layout follows terminal width; readable chrome without overlap

## 0.2.10 — 2026-09-07

### Changed

- Compact one-line chrome; drop overlapping art and long copy

## 0.2.9 — 2026-09-07

### Fixed

- Nav keys S/B/M/… work from Setup/Tasks; menu pinned to the top so it is not covered

## 0.2.8 — 2026-09-07

### Fixed

- Only `ollama pull` tags that exist in the Ollama library (no Agents-A1, etc.)
- Welcome art: compact llama + Claude-style header, `by devjaime`

## 0.2.7 — 2026-09-07

### Added

- Colored pudú ASCII welcome and `by devjaime` signature; colored nav on every screen

## 0.2.6 — 2026-09-07

### Added

- Visible Setup screen: install recommended models and link/install OpenCode, Hermes, OpenClaw (`npx pudu-ai setup` or press S)

## 0.2.5 — 2026-09-07

### Fixed

- TUI crash on Tasks/Recommend: `letter` used before initialization

## 0.2.4 — 2026-09-07

### Added

- Color grades and runtime status in TUI/CLI
- Recommend can `ollama pull` eligible models (S–B) and link/install OpenCode, Hermes, OpenClaw

## 0.2.2 — 2026-09-06

### Added

- `npx pudu-ai launch` — explain Ollama integrations (OpenCode, OpenClaw, Hermes, Claude Code) and run `ollama pull` / `ollama launch` only with `--yes` when the model meets hardware gates

## 0.2.1 — 2026-09-06

### Added

- `npx pudu-ai tasks` and TUI `[T]`: questionnaire (en/es) that recommends OpenCode-style harnesses per model for code, video, image, transcription, and chat tasks

## 0.2.0 — 2026-09-06

### Changed

- CLI and npm package renamed to `pudu-ai` (`npx pudu-ai`)
- Data directory is now `~/.pudu-ai/`
- User-facing brand is Pudu-AI (English default, Spanish via `--lang es`)

## 0.1.1 — 2026-09-06

### Added

- English-first i18n catalog (`src/i18n`) as the default locale
- TUI history view (`[L]`)
- LM Studio GGUF discovery (known directories, depth-limited)
- macOS swap measurement via `vm.swapusage`
- Benchmark process PID attached to telemetry (RSS / process CPU)

### Changed

- Catalog models list now shows estimated FIT grades
- Recommendations pick distinct models per use case

## 0.1.0 — 2026-09-06

### Added

- MVP for macOS Apple Silicon
- Hardware detection (unified memory, Apple Silicon generation, cores)
- Ollama model discovery and GGUF blob resolution
- llama-bench integration with JSON/markdown parsers
- Live Ink TUI dashboard and benchmark view
- CanIRun.ai catalog/compatibility/recommend with local cache
- Benchmark history
- CLI: hardware, models, recommend, benchmark, compare, history, doctor, report
- JSON/CSV flags and `--no-network`
