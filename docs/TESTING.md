# Testing Pudu

English is the default UI. Use `--lang es` to check Spanish.

## 0. One-time setup

```bash
cd /path/to/pudu-ai
npm install
npm run typecheck
npm test
npm run build
```

Needs Node 20+. Optional for live benches: `ollama`, `llama-bench` (`brew install llama.cpp`).

Run the CLI without publishing:

```bash
npx tsx src/cli/index.ts
# or after build
node dist/cli/index.js
```

## 1. What you can try on this Mac

You already have Apple Silicon, Ollama (`qwen3:8b`, `qwen3.5:4b`) and `llama-bench`.

| Check | Command | Pass if |
| --- | --- | --- |
| Help | `npx tsx src/cli/index.ts --help` | Commands say `npx pudu`, credits mention midudev / CanIRun.ai |
| Doctor | `npx tsx src/cli/index.ts doctor --no-network` | Node, Apple Silicon, Ollama, llama-bench |
| Hardware | `npx tsx src/cli/index.ts hardware --json --no-network` | Unified Memory, not VRAM; no serial/UUID |
| Models | `npx tsx src/cli/index.ts models --no-network` | Installed vs compatible; Estimated vs Measured |
| Recommend | `npx tsx src/cli/index.ts recommend` | Estimates labelled; CanIRun credit |
| Spanish | `npx tsx src/cli/index.ts doctor --lang es` | Spanish copy |
| JSON bench | `npx tsx src/cli/index.ts benchmark qwen3:8b --json --preset quick --no-network` | JSON only, file in `~/.pudu/benchmarks/` |
| History | `npx tsx src/cli/index.ts history --json` | Last run present |
| Report | `npx tsx src/cli/index.ts report --markdown` | Markdown table |
| TUI | `npx tsx src/cli/index.ts` | Keys B M R H C L Q; Ctrl+C restores terminal |

Skip the live bench if you only want a 30-second smoke test (`doctor` + `hardware` + `models`).

A full `quick` llama-bench on 8B can take several minutes.

## 2. OpenCode-style harnesses

Run **one task per OpenCode session**. Do not mix TUI work with parser work.

Each harness: goal, command, pass/fail. No extra features.

### H1 — Unit parsers (no GPU)

```
In this repo, run npm test and npm run typecheck.
Do not change production code unless a test fails.
Report pass/fail counts only.
```

### H2 — CLI doctor smoke

```
Run: npx tsx src/cli/index.ts doctor --no-network
Pass: exits 0, prints Pudu Doctor, does not crash if llama-bench missing.
If llama-bench is missing it must print install instructions, not auto-install.
```

### H3 — Hardware JSON privacy

```
Run: npx tsx src/cli/index.ts hardware --json --no-network
Pass: JSON has os, cpu, memory.unified.
Fail if output contains serial, UUID, username, or the word VRAM on Apple Silicon.
```

### H4 — Estimated vs measured labels

```
Run: npx tsx src/cli/index.ts models --no-network
Pass: INSTALLED and COMPATIBLE sections exist.
EST. SPEED / FIT are labelled estimated.
MEASURED is Not tested or a real t/s from history — never invent t/s.
Credits mention CanIRun.ai and midudev on recommend/help.
```

### H5 — i18n English default + Spanish

```
Run doctor with no --lang, then doctor --lang es.
Pass: default English; --lang es uses Spanish strings from src/i18n/es.ts.
Do not add a third language.
```

### H6 — JSON benchmark (optional, slow)

```
Only if llama-bench and an Ollama GGUF blob exist.
Run: npx tsx src/cli/index.ts benchmark qwen3:8b --json --preset quick --no-network
Pass: stdout is JSON (no TUI), schemaVersion 1, origin measured,
prompt/generation t/s numbers or omitted (never fake power/GPU).
A file is written under ~/.pudu/benchmarks/.
Ctrl+C during a retry must kill llama-bench (no zombies).
```

### H7 — Compare / history / report

```
Requires at least two saved measured runs (run H6 on two models if needed).
Check: history --json, history --csv, compare, report --markdown.
Pass: compare does not invent a quality score from speed.
Quality must stay labelled as catalog metadata.
```

## 3. Suggested OpenCode order

1. H1 unit  
2. H2 doctor  
3. H3 hardware  
4. H4 labels  
5. H5 i18n  
6. H6 bench (when you have time)  
7. H7 history  

After H6/H7, only then iterate on TUI polish in a separate session.
