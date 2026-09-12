# Pudu Agent Lab

[English](agent-lab.md) · [Español](agent-lab.es.md)

Local-first observability, code intelligence, and reproducible agent benchmarking.

This document is the design spec. **Iteration 1 implements repository search only.** Later phases are specified here so they are not invented ad hoc. Do not implement them until the design is approved.

Related existing specs (do not replace):

- `00-overview.md` — hardware/model lab
- `01-architecture.md` — TypeScript CLI layers, subprocess rules, `~/.pudu-ai/`
- `03-scoring.md` — **Pudu-AI Score** (hardware only; never fold task quality into it)
- `04-privacy.md` — local-first, `--no-network`

Existing `src/tasks/` is an OpenCode-style **model harness planner** (what to try on a local LLM). Agent Lab **software-engineering tasks** are a different abstraction and live under `src/agent-lab/` plus `python/pudu_agent/`.

---

## Problem statement

Coding agents fail or waste context because they treat a repository as a bag of files:

1. They grep noisily or dump whole files into the prompt.
2. They miss structural facts (this is a *definition*, that is a *call*).
3. They cannot answer impact questions (who calls X, which tests break).
4. They cannot compare retrieval strategies on the same task.
5. Hardware/model speed (tokens/s) is mixed with *task quality* (tests pass, context used).

Pudu-AI already measures **whether a local model can run**. Agent Lab measures **whether an agent can solve a software task with minimal, relevant context**, using deterministic code intelligence before any LLM.

Differentiator:

> OBSERVABILITY + CODE INTELLIGENCE + REPRODUCIBLE AGENT BENCHMARKING

Pudu-AI is **not** another generic coding assistant.

---

## Design principles

1. **Inspect before editing.** Reuse CLI parse/dispatch, `spawnTracked`, `commandExists`, JSON-first output, estimated vs measured labels.
2. **Preserve the hardware lab.** Do not rewrite TUI, benchmark engine, or Pudu-AI Score semantics.
3. **TypeScript CLI remains the application.** Python is an optional deterministic analysis engine.
4. **Structured JSON only** between TypeScript and Python. Never parse human tool output when `--json` exists (`rg --json`, `ast-grep --json`).
5. **Deterministic tools before LLMs.** A router maps intent → strategy. Do not call a model to grep.
6. **Not every agent needs an LLM.** Graph and verifier may be fully deterministic.
7. **Minimum context, maximum relevance.** Prefer symbol ranges over whole files.
8. **Never fabricate metrics.** Use `null` in JSON and `N/A` in text. Label **MEASURED** / **ESTIMATED** / **DERIVED**.
9. **Local-first.** Repo, graph, traces, and prompts stay on disk. `--no-network` remains binding.
10. **Adapters, not forks.** Consume Graphify output if present. Do not copy Graphify or Oh My OpenAgent source.
11. **Business logic outside the TUI.** JSON outputs exist before any fancy UI.
12. **Skip, don't crash** when `rg`, `ast-grep`, Graphify, or Ollama are missing.
13. **Small iterations.** Iteration 1 = spec + types + protocol + `pudu-ai repo search`.

---

## Why rg vs ast-grep vs graph

References (conceptual only): ripgrep, ast-grep, tree-sitter, Graphify, OpenCode subagents, Oh My OpenAgent, MCP-style local tools.

### Literal search → `rg`

Appropriate when the *bytes* matter:

- exact strings, config values, comments, filenames, error messages, simple identifiers

AST search is the wrong default here: comments and YAML/JSON/TOML are not the language AST, and regex/literal scan is cheaper and complete.

### Syntactic search → `ast-grep`

Appropriate when the *shape* matters:

- function/class definitions vs calls
- decorators, imports, unsafe constructs, refactoring candidates

Oh My OpenAgent-style systems split these because `validate_user` as text hits comments, tests, logs, and calls; `def $FUNC($$$ARGS): $$$BODY` hits definitions. Mixing them hides precision and inflates context.

tree-sitter is the usual parser underneath; Agent Lab calls **ast-grep** rather than embedding tree-sitter in Node for iteration 1.

### Relationship / impact → code graph

Appropriate when the *edge* matters:

- who calls X, what depends on Y, what breaks if Z changes
- path A→B, tests related to a component, architectural exploration

**Graphify (backend A):** if installed and `graphify-out/graph.json` exists, consume it. Typical relation kinds to *map* (not invent): `imports`, `calls`, `inherits`, `references`, `definitions`, plus node types `file`, `module`, `test`. Do not copy Graphify.

**PythonLocalGraph (backend B):** stdlib `ast` for Python repos only; write `.pudu-ai/code-graph.json`. Every edge has `confidence: EXTRACTED | RESOLVED | INFERRED` and evidence (`file`, `line`, `symbol`) when available. Never invent edges.

---

## Architecture

```
             Pudu CLI (TypeScript)
                     |
             Agent Lab Orchestrator
                     |
       +-------------+-------------+
       |             |             |
     Search        Graph       Metrics
       |             |             |
       v             v             v
  Python tools    Graphify      Trace Store
  ast-grep        adapter       ~/.pudu-ai/tasks
  ripgrep                       .pudu-ai/traces
       |
       v
   Context Pack
       |
       v
    Local LLM (optional per agent)
       |
       v
   Mini Agents
       |
       v
 Test / Lint / Build
       |
       v
    Task Score
```

### Process boundary

```
TypeScript  --stdin JSON-->  python -m pudu_agent
            <--stdout JSON--
```

- Timeouts on every exec (existing `spawnTracked`).
- PYTHONPATH points at `python/` shipped with the package.
- Python is optional: hardware commands must keep working if Python is absent.
- Agent Lab commands **must not** call `loadSession` (no hardware/model/CanIRun scan).

### Layers (additions)

| Layer | Path | UI? |
| --- | --- | --- |
| Agent Lab types / CLI | `src/agent-lab` | no |
| Python engine | `python/pudu_agent` | no |
| Traces (later) | `.pudu-ai/traces`, `~/.pudu-ai/tasks` | no |

---

## CLI design

Namespaces (target; * = iteration 1):

```
pudu-ai repo scan
pudu-ai repo search QUERY                 *
pudu-ai repo search --structural PATTERN  *
pudu-ai repo graph
pudu-ai repo explain SYMBOL
pudu-ai repo callers SYMBOL
pudu-ai repo path A B
pudu-ai repo impact SYMBOL

pudu-ai context build --task "..." --budget N

pudu-ai agent run --task "..."
pudu-ai task run --task tasks/example.md
pudu-ai task report LAST
pudu-ai trace LAST
pudu-ai experiment --task ... --strategies rg,ast,graph,hybrid
```

Global flags that apply whenever practical: `--json`, `--no-network`, `--verbose`, `--no-color`.

Repo flags (iteration 1):

| Flag | Meaning |
| --- | --- |
| `--repo PATH` | Repository root (default: cwd) |
| `--structural PATTERN` | ast-grep pattern; intent STRUCTURAL |
| `--intent TEXT\|STRUCTURAL\|...` | Override router |
| `--glob GLOB` | Repeatable include glob for search |
| `--limit N` | Max matches (default 100) |

`--lang` remains **UI locale** (`en` \| `es`). Do not overload it as ast-grep `--lang`.

---

## Search router

```
SearchIntent =
    TEXT | STRUCTURAL | RELATIONSHIP | IMPACT | SEMANTIC | UNKNOWN
```

| Intent | Strategy | Iteration 1 |
| --- | --- | --- |
| TEXT | `rg` | yes |
| STRUCTURAL | `ast-grep` | yes |
| RELATIONSHIP | graph | stub: empty + error, no fake edges |
| IMPACT | graph | stub |
| SEMANTIC | later (still no LLM required for routing) | stub |
| UNKNOWN | `rg` + `ast-grep` | yes |

Default for a plain identifier or error string: **TEXT**. Structural metavariables (`$FUNC`, `$$$ARGS`) or `--structural`: **STRUCTURAL**. Ambiguous `--intent UNKNOWN`: hybrid. Graph intents do not fall back to an LLM.

---

## Data model

JSON uses **camelCase** like existing `BenchmarkRecord`. Python may use snake_case internally. Unavailable values are `null`, never guessed.

Metric origin on every computed field that can be missing:

`MEASURED` | `ESTIMATED` | `DERIVED`

Canonical TypeScript types: `src/agent-lab/types.ts`.

### SearchResult (iteration 1)

Matches, tool availability, errors, `durationMs` / `matchCount` as MEASURED.

### ContextPack (later)

`task`, `strategy`, `symbols`, `files` (prefer ranges), `relationships`, `tests`, `tokenEstimate`, `contextWindow`, `contextUtilization`, `searchTrace`.

### AgentRun (later)

Roles: `scout` | `graph` | `context` | `builder` | `verifier`.

### TaskTrace (later)

Stored at `.pudu-ai/traces/<timestamp>-<task-id>.json` or `~/.pudu-ai/tasks/`. Includes git commit, search counts, context reduction, LLM tokens, tool calls, files touched, verification. Missing slices stay `null`.

### TaskMetrics (later)

**Pudu Task Score** (0.00–1.00), separate from hardware Pudu-AI Score:

| Dimension | Weight |
| --- | --- |
| Verification success | 40% |
| Task rubric | 25% |
| Context efficiency | 15% |
| Tool efficiency | 10% |
| Retry penalty | 10% |

Correctness dominates: context efficiency cannot compensate for failed tests.

**Pudu Task Effort** is a DERIVED engineering proxy (tools, tokens, wall time, searches, files, retries, verification cycles, human interventions). Labels: LOW / MEDIUM / HIGH / VERY_HIGH and optional 0–100. It is **not** cognitive effort.

`--human-baseline-minutes` is user-supplied. If omitted: Human baseline `N/A`. Never invent it.

---

## Measurement methodology

| Quantity | Origin |
| --- | --- |
| rg/ast-grep match counts, durations, exit codes | MEASURED |
| Tool missing | MEASURED availability=false; results not invented |
| Repository token count without a real tokenizer | ESTIMATED, labelled Estimated |
| Context utilization = selected / window | DERIVED from measured or estimated inputs |
| Task Score / Effort | DERIVED from measured traces |
| Human baseline | user input or N/A |

Context-window observability (later) per model/agent: input, output, total, window, utilization %, remaining tokens, repository reduction %.

---

## Experimental methodology

`pudu-ai experiment` runs the **same task** under strategies: `raw`, `rg`, `ast`, `graph`, `hybrid`, `hybrid-multi-agent`.

All table values come from real traces. Mock/demo mode must be labelled. Public or synthetic repos only for demos (PyCon): prove that better deterministic retrieval uses dramatically less context, not that “AI can write code.”

---

## Mini-agent ecosystem (later)

Five roles, sequential: Scout → Graph → Context → Builder → Verifier.

Scout/Graph/Context: no file edits. Builder may edit, and receives only the ContextPack. Verifier runs pytest/lint/typecheck/build; no production edits unless authorized.

Measure whether delegation helps or hurts. Do not add agents for their own sake.

Per-agent model mapping (later): many roles `deterministic`. Prefer Ollama / llama.cpp already detected by the hardware lab.

---

## Privacy guarantees

Default:

- repository, graph, traces, context packs stay local
- no telemetry upload, no code upload
- prompts stay local when using local models
- `--no-network` disables outbound requests (same as hardware lab)
- future cloud providers must be explicit opt-in

Agent Lab does not send repo contents to CanIRun or any catalog API.

---

## Limitations

- Iteration 1 does not build graphs, context packs, agents, traces, or scores.
- Python, `rg`, and `ast-grep` are optional; search degrades or skips.
- Graphify may be absent; PythonLocalGraph is Python-only.
- ast-grep patterns are language-specific; UI `--lang` is not a code-language flag.
- Semantic search is unspecified beyond “not an LLM router.”
- Token counts may be ESTIMATED until a real tokenizer is wired.
- npm packaging must ship `python/` next to the bundled CLI (`import.meta.url` → `../../python`).

---

## Iteration 1 scope (this change)

In:

- this spec
- TypeScript interfaces
- Python JSON protocol
- `rg` + `ast-grep` adapters
- `pudu-ai repo search`
- fixtures + tests
- usage notes

Out (need explicit approval):

- Phase 2 graph and `repo explain|path|callers|dependencies|impact`
- Phases 3–12 context, agents, traces, effort, experiment, task score, demo harness
- TUI for Agent Lab
