# Pudu-AI

**Local AI Hardware & Benchmark Lab** for the terminal.

Discover, inspect, benchmark, and compare models that run on your machine. Measurements stay local. Estimates are never mixed with real `llama-bench` results.

```bash
npx pudu-ai
```

English is the default UI language. Use `--lang es` for Spanish. Docs: [English](README.md) · [Español](README.es.md).

> **PyCon 2026:** a standard-library Python tool (`python/pudu_agent`) uses the AST to collect bounded, citable impact evidence for `GenerationMixin.generate` in a pinned `huggingface/transformers` checkout. Local models are an optional second layer. See [the demo section](#pycon-2026-transformers--ollama-demo) and the [presentation runbook (Spanish)](docs/demos/pycon-2026/DEMO_RUNBOOK.es.md).

The npm name `pudu` is taken by an empty stub. This CLI is **`pudu-ai`**.

## Install

From this repo (not yet on npm):

```bash
git clone https://github.com/devjaime/pudu-ai.git
cd pudu-ai
npm install
npx . --lang es
```

Or:

```bash
npm run pudu-ai -- --lang es
```

After publish:

```bash
npx pudu-ai
```

## Commands

```bash
npx pudu-ai
npx pudu-ai hardware
npx pudu-ai models
npx pudu-ai models add-path ~/Models
npx pudu-ai setup
npx pudu-ai recommend
npx pudu-ai recommend --install --yes
npx pudu-ai recommend --link opencode --yes
npx pudu-ai tasks
npx pudu-ai tasks --for code,image,transcription --lang es
npx pudu-ai benchmark
npx pudu-ai benchmark qwen3:8b
npx pudu-ai benchmark qwen3:8b --json --preset quick
npx pudu-ai compare
npx pudu-ai history
npx pudu-ai history --csv
npx pudu-ai doctor
npx pudu-ai report --markdown
npx pudu-ai launch
npx pudu-ai launch opencode
npx pudu-ai launch opencode --yes
npx pudu-ai launch antigravity
npx pudu-ai launch antigravity gemma4:e4b --out ./antigravity.local.json --yes
npx pudu-ai repo search validate_user --json
npx pudu-ai repo search --structural 'def $FUNC($$$ARGS): $$$BODY' --repo .
npx pudu-ai repo graph --vault ~/vault --json
npx pudu-ai repo graph --vault ~/vault --out /tmp/pudu-obsidian --yes
```

Flags: `--json` `--csv` `--no-network` `--no-color` `--verbose` `--preset quick|standard|stress` `--lang en|es` `--for` `--scope` `--priority` `--repo` `--structural` `--intent` `--glob` `--limit` `--vault` `--out` `--from` `--yes`

```bash
npx pudu-ai --lang es
npx pudu-ai doctor --lang es
```

`PUDU_AI_LANG=es` or a Spanish `LANG` (e.g. `es_CL.UTF-8`) also selects Spanish. Unrecognized locales fall back to English.

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

**Measured** values come from `llama-bench` and OS telemetry. **Estimated** values come from [CanIRun.ai](https://canirun.ai) by [midudev](https://midu.dev) ([GitHub](https://github.com/midudev/canirun.ai)) or a local fallback, and are labelled as such.

If a metric cannot be measured (GPU %, package power, temperature without extra permissions), Pudu-AI prints `N/A`. It does not invent numbers.

On Apple Silicon the memory figure is **Unified Memory**, never VRAM.

## Interpreting metrics

- **Prompt t/s** — prompt processing throughput (measured).
- **Generation t/s** — token generation throughput (measured).
- **Peak memory** — system-wide peak during the run (not claimed as model-only).
- **Average GPU** — system-wide when available.
- **t/s/W** — generation tokens per second per watt when power is measured.
- **Pudu-AI Score** — hardware performance only (speed, memory, energy, thermals, swap). It does **not** include model quality/intelligence.

See `docs/spec/03-scoring.md`.

## Ollama integrations

Pudu-AI can explain and, **only if a recommended model fits this hardware**, pull and launch:

| Tool | Docs | Command |
| --- | --- | --- |
| OpenCode | [docs.ollama.com/integrations/opencode](https://docs.ollama.com/integrations/opencode) | `npx pudu-ai launch opencode` |
| OpenClaw | [docs.ollama.com/integrations/openclaw](https://docs.ollama.com/integrations/openclaw) | `npx pudu-ai launch openclaw` |
| Hermes | [docs.ollama.com/integrations/hermes](https://docs.ollama.com/integrations/hermes) | `npx pudu-ai launch hermes` |
| Claude Code | [docs.ollama.com/integrations/claude-code](https://docs.ollama.com/integrations/claude-code) | `npx pudu-ai launch claude` |
| Antigravity | [local models](https://antigravity.google/docs/sdk/local-models) | `npx pudu-ai launch antigravity` |

Without `--yes` the command only explains eligibility (grade S–B, coding/chat use case, measured t/s floor when a benchmark exists). It will **not** `ollama pull`, install, or `ollama launch` unless `--yes` is set **and** the gate passes. Pudu-AI never curl-pipes installers.

Antigravity is not an `ollama launch` target. It checks a local Gemma 4 tag (`e2b`, `e4b`, `12b`, `26b`, `31b`) against unified memory and writes a loopback config (`http://127.0.0.1:11434/v1`) only with `--yes` and `--out`. Cloud tags (`gemma4:cloud`) are blocked. In the TUI, **[S] Setup** then **[7]** installs the Homebrew cask `antigravity`, or opens the app if it is already there. That does not start a local agent.

```bash
npx pudu-ai launch
npx pudu-ai launch opencode --yes
```

## Agent Lab (preview)

Deterministic repository search. Optional Python 3.10+, `rg`, and `ast-grep`. No LLM.

- Usage: [English](docs/agent-lab-usage.md) · [Español](docs/agent-lab-usage.es.md)
- Spec: [English](docs/spec/agent-lab.md) · [Español](docs/spec/agent-lab.es.md)

```bash
npx pudu-ai repo search validate_user --repo . --json
npx pudu-ai repo search --structural 'def $FUNC($$$ARGS): $$$BODY'
npx pudu-ai repo graph --repo .
npx pudu-ai repo graph --vault ~/vault --json
npx pudu-ai repo export --from graph.json --out /tmp/pudu-obsidian --yes
npx pudu-ai repo harness --task "fix validate_user" --json
npx pudu-ai repo search validate_user --lang es
```

Requires `python3` on PATH for code search and the Python AST graph. The vault graph and Obsidian export do not. If `rg` or `ast-grep` is missing, JSON reports `available: false` instead of inventing hits.

`--vault` reads markdown wikilinks. A missing note is unresolved, not an edge. `--out` without `--yes` prints the export plan and writes nothing. Spec: `docs/spec/05-local-workbench.md`.

## Experimental local task worker

Runs a text-only task with a local Ollama model. Repository context is bounded; generated code or commands are not applied or executed, and cloud model tags are rejected.

```bash
npx pudu-ai task run --task "Summarize the authentication flow" --repo . --model auto --json --no-network
```

The live Ollama integration test is opt-in (`PUDU_INTEGRATION=1`). See the [English guide](docs/agent-lab-usage.md), [Spanish guide](docs/agent-lab-usage.es.md), and [workflow diagram](docs/diagrams/local-task-worker-flow.html).

## PyCon 2026 Transformers + Ollama demo

**What it shows:** before changing `GenerationMixin.generate`, a deterministic collector (`pudu_agent.transformers_evidence`) checks the pinned fixture (`v5.20.2`, `18329f10…`) and uses Python's `ast` module to find the definition, a caller, inheritance candidates, public configuration, and test references. The [evidence report](docs/demos/pycon-2026/evidence/report.md) cites 13 files: 3,682 bytes of metadata versus 816,502 bytes of full files. Those are byte counts, not tokens. Runtime impact is not proven: `RUNTIME_TESTS` and `MODEL_ANALYSIS` stay `NOT_RUN` in the snapshot. A local Ollama model can then interpret the bounded evidence, and its answer is treated as unverified. If the fixture is not at `/Volumes/KINGSTON/pudu-pycon-2026/transformers`, export `PUDU_TRANSFORMERS_FIXTURE` with its absolute path.

**English quick path — web:** In Terminal 1, confirm port `11435` is unused and start a separate local-only Ollama process: `OLLAMA_HOST=127.0.0.1:11435 OLLAMA_NO_CLOUD=1 ollama serve`. In Terminal 2, from the repository root, run `OLLAMA_HOST=127.0.0.1:11435 ollama list` and reuse only a model already visible there, then start the web app with `PYTHONPATH=python python3 -m pudu_agent.pycon_web --ollama-url http://127.0.0.1:11435 --port 8765`. Open [http://127.0.0.1:8765](http://127.0.0.1:8765), refresh preflight and installed models, select a model, and start the run. The web server does not start/stop Ollama or pull models. `OLLAMA_NO_CLOUD=1` is operator configuration, not API attestation; polling exhaustion does not stop a run, and structural validity does not establish factual correctness. For the direct CLI fallback and full walkthrough, see the [Spanish runbook](docs/demos/pycon-2026/DEMO_RUNBOOK.es.md).

**Español — acceso rápido web:** En la Terminal 1, confirme que `11435` esté libre e inicie una instancia Ollama separada: `OLLAMA_HOST=127.0.0.1:11435 OLLAMA_NO_CLOUD=1 ollama serve`. En la Terminal 2, desde la raíz del repositorio, ejecute `OLLAMA_HOST=127.0.0.1:11435 ollama list` y reutilice solo un modelo ya visible allí; luego inicie la web con `PYTHONPATH=python python3 -m pudu_agent.pycon_web --ollama-url http://127.0.0.1:11435 --port 8765`. Abra [http://127.0.0.1:8765](http://127.0.0.1:8765), actualice preflight e inventario, seleccione un modelo e inicie la corrida. El servidor web no inicia ni detiene Ollama ni descarga modelos. `OLLAMA_NO_CLOUD=1` es configuración del operador, no una atestación de la API; agotar el horizonte de consulta no termina la corrida y la validez estructural no demuestra corrección factual. El [runbook completo en español](docs/demos/pycon-2026/DEMO_RUNBOOK.es.md) incluye el flujo paso a paso y el fallback por CLI directa.

## Privacy

Local-first. Benchmarks, model paths, and machine identifiers stay in `~/.pudu-ai/`. Nothing is uploaded. Network is optional and used only for the CanIRun catalog (`--no-network` disables it).

## Architecture

```
Hardware → discovery → compatibility → benchmark + telemetry → storage → TUI / JSON / CSV
```

Business logic does not depend on Ink. Specs live in `docs/spec/`. UI strings live in `src/i18n/en.ts` and `src/i18n/es.ts`.

## Credits

**Measured** performance is produced by Pudu-AI using `llama-bench` and native OS telemetry.

**Estimated** compatibility, catalog metadata, and recommended models come from **[CanIRun.ai](https://canirun.ai)** by **[midudev](https://midu.dev)** — also see the source repo [midudev/canirun.ai](https://github.com/midudev/canirun.ai). Those estimates are always labelled *Estimated* and are never mixed with measured results.

Pudu-AI does not copy CanIRun.ai source. Telemetry is inspired by tools such as basitop but implemented with native OS APIs (`sysctl`, `vm_stat`, `memory_pressure`, Node `os`) — the TUI of other tools is never scraped.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). MIT licensed.
