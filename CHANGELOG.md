# Changelog

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


### Added

- MVP for macOS Apple Silicon
- Hardware detection (unified memory, Apple Silicon generation, cores)
- Ollama model discovery and GGUF blob resolution
- llama-bench integration with JSON/markdown parsers
- Live Ink TUI dashboard and benchmark view
- CanIRun.ai catalog/compatibility/recommend with local cache
- Benchmark history in `~/.localmeter/`
- CLI: hardware, models, recommend, benchmark, compare, history, doctor, report
- JSON/CSV flags and `--no-network`
