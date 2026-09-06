# LocalMeter AI

**Local AI Hardware & Benchmark Lab** for the terminal.

Discover, inspect, benchmark, and compare models that run on your machine. Measurements stay local. Estimates are never mixed with real `llama-bench` results.

```bash
npx localmeter-ai
```

> Screenshot/GIF of the TUI: run the dashboard locally (`npx localmeter-ai`) on Apple Silicon. A recorded GIF will land in `docs/assets/` in a follow-up release.

## Install

Nothing global is required besides Node.js 20+:

```bash
npx localmeter-ai
```

Or clone this repo (`pudu-ai`) and run the package `localmeter-ai`:

```bash
git clone https://github.com/devjaime/pudu-ai.git
cd pudu-ai
npm install
npm run build
node dist/cli/index.js
```

## Commands

```bash
npx localmeter-ai
npx localmeter-ai hardware
npx localmeter-ai models
npx localmeter-ai models add-path ~/Models
npx localmeter-ai recommend
npx localmeter-ai benchmark
npx localmeter-ai benchmark qwen3:8b
npx localmeter-ai benchmark qwen3:8b --json --preset quick
npx localmeter-ai compare
npx localmeter-ai history
npx localmeter-ai history --csv
npx localmeter-ai doctor
npx localmeter-ai report --markdown
```

Flags: `--json` `--csv` `--no-network` `--no-color` `--verbose` `--preset quick|standard|stress`

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
| LM Studio | detect only | later | later |
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

If a metric cannot be measured (GPU %, package power, temperature without extra permissions), LocalMeter prints `N/A`. It does not invent numbers.

On Apple Silicon the memory figure is **Unified Memory**, never VRAM.

## Interpreting metrics

- **Prompt t/s** — prompt processing throughput (measured).
- **Generation t/s** — token generation throughput (measured).
- **Peak memory** — system-wide peak during the run (not claimed as model-only).
- **Average GPU** — system-wide when available.
- **t/s/W** — generation tokens per second per watt when power is measured.
- **LocalMeter Score** — hardware performance only (speed, memory, energy, thermals, swap). It does **not** include model quality/intelligence.

See `docs/spec/03-scoring.md`.

## Privacy

Local-first. Benchmarks, model paths, and machine identifiers stay in `~/.localmeter/`. Nothing is uploaded. Network is optional and used only for the CanIRun catalog (`--no-network` disables it).

## Architecture

```
Hardware → discovery → compatibility → benchmark + telemetry → storage → TUI / JSON / CSV
```

Business logic does not depend on Ink. Specs live in `docs/spec/`.

## Credits

Compatibility catalog and grading concepts use the public API of [CanIRun.ai](https://github.com/midudev/canirun.ai) by [midudev](https://midu.dev). LocalMeter does not copy that project’s source. Telemetry is inspired by tools such as basitop but implemented with native OS APIs (`sysctl`, `vm_stat`, `memory_pressure`, Node `os`) — the TUI of other tools is never scraped.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). MIT licensed.
