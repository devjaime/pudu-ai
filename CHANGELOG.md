# Changelog

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
