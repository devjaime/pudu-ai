# Pudu

**Local AI Hardware & Benchmark Lab** for the terminal.

Discover, inspect, benchmark, and compare models that run on your machine. Measurements stay local. Estimates are never mixed with real `llama-bench` results.

```bash
npx pudu
```

English is the default UI language. Use `--lang es` for Spanish.

## Install

Nothing global is required besides Node.js 20+:

```bash
npx pudu
```

Or clone this repo (`pudu-ai`) and run the `pudu` CLI:

```bash
git clone https://github.com/devjaime/pudu-ai.git
cd pudu-ai
npm install
npm run build
npx pudu
```

## Commands

```bash
npx pudu
npx pudu hardware
npx pudu models
npx pudu models add-path ~/Models
npx pudu recommend
npx pudu benchmark
npx pudu benchmark qwen3:8b
npx pudu benchmark qwen3:8b --json --preset quick
npx pudu compare
npx pudu history
npx pudu history --csv
npx pudu doctor
npx pudu report --markdown
```

Flags: `--json` `--csv` `--no-network` `--no-color` `--verbose` `--preset quick|standard|stress` `--lang en|es`

```bash
npx pudu --lang es
npx pudu doctor --lang es
```

`PUDU_LANG=es` or a Spanish `LANG` (e.g. `es_CL.UTF-8`) also selects Spanish. Unrecognized locales fall back to English.

## Supported platforms (MVP)

| Phase | Platform |
| --- | --- |
| 1 (this release) | macOS Apple Silicon |
| 2 | LM Studio / MLX adapters, richer energy metrics |
| 3 | Linux NVIDIA, Linux AMD, Windows |

## Supported runtimes

| Runtime | Detect | List models | Benchmark |
| --- | --- | --- | --- |
| Ollama | yes | yes | via resolved GGUF blob + llama-bench |
| llama.cpp / llama-bench | yes | GGUF dirs | yes |
| LM Studio | yes | GGUF in known dirs | via llama-bench |
| MLX | detect only | later | later |

## Benchmark methodology

Default mini benchmark:

```bash
llama-bench -m MODEL -p 512 -n 128 -r 3 -o json
```

| Preset | prompt | gen | repeats |
| --- | --- | --- | --- |
| Quick | 512 | 128 | 3 |
| Standard | 2048 | 256 | 5 |
| Stress | 4096 | 512 | 10 |

**Measured** values come from `llama-bench` and OS telemetry. **Estimated** values come from [CanIRun.ai](https://canirun.ai) (or a local fallback) and are labelled as such.

If a metric cannot be measured (GPU %, package power, temperature without extra permissions), Pudu prints `N/A`. It does not invent numbers.

On Apple Silicon the memory figure is **Unified Memory**, never VRAM.

## Interpreting metrics

- **Prompt t/s** — prompt processing throughput (measured).
- **Generation t/s** — token generation throughput (measured).
- **Peak memory** — system-wide peak during the run (not claimed as model-only).
- **Average GPU** — system-wide when available.
- **t/s/W** — generation tokens per second per watt when power is measured.
- **Pudu Score** — hardware performance only (speed, memory, energy, thermals, swap). It does **not** include model quality/intelligence.

See `docs/spec/03-scoring.md`.

## Privacy

Local-first. Benchmarks, model paths, and machine identifiers stay in `~/.pudu/`. Nothing is uploaded. Network is optional and used only for the CanIRun catalog (`--no-network` disables it).

## Architecture

```
Hardware → discovery → compatibility → benchmark + telemetry → storage → TUI / JSON / CSV
```

Business logic does not depend on Ink. Specs live in `docs/spec/`. UI strings live in `src/i18n/en.ts` and `src/i18n/es.ts`.

## Credits

Compatibility catalog and grading concepts use the public API of [CanIRun.ai](https://github.com/midudev/canirun.ai) by [midudev](https://midu.dev). Pudu does not copy that project’s source. Telemetry is inspired by tools such as basitop but implemented with native OS APIs (`sysctl`, `vm_stat`, `memory_pressure`, Node `os`) — the TUI of other tools is never scraped.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). MIT licensed.
