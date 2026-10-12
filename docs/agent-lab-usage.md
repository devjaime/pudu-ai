# Agent Lab usage (English)

[English](agent-lab-usage.md) · [Español](agent-lab-usage.es.md)

UI language: `--lang en` (default) or `--lang es`. That flag is **not** the ast-grep code language.

Design spec: [English](spec/agent-lab.md) · [Español](spec/agent-lab.es.md)

## Requirements

| Tool | Required for | If missing |
| --- | --- | --- |
| Node 20+ | CLI | CLI will not start |
| `python3` (3.10+) | `repo search` | error, no fake results |
| `rg` (ripgrep) | TEXT search | JSON `tools.rg.available: false` |
| `ast-grep` or `sg` | STRUCTURAL search | JSON `tools.astGrep.available: false` |

Hardware commands (`hardware`, `benchmark`, …) work without Python.

## Commands (iteration 1)

```bash
npx pudu-ai repo
npx pudu-ai repo search validate_user
npx pudu-ai repo search validate_user --repo . --json
npx pudu-ai repo search validate_user --glob '*.py' --limit 20
npx pudu-ai repo search --structural 'def $FUNC($$$ARGS): $$$BODY' --repo .
npx pudu-ai repo search validate_user --intent UNKNOWN --json
npx pudu-ai repo search validate_user --lang es
```

| Flag | Meaning |
| --- | --- |
| `--repo PATH` | Repository root (default: current directory) |
| `--structural PAT` | ast-grep pattern (STRUCTURAL) |
| `--intent INTENT` | `TEXT` `STRUCTURAL` `RELATIONSHIP` `IMPACT` `SEMANTIC` `UNKNOWN` |
| `--glob GLOB` | Repeatable include glob |
| `--limit N` | Max matches (default 100) |
| `--json` | `SearchResult` JSON |
| `--lang en\|es` | UI locale |

## Router

- Identifier or error string → `rg` (TEXT)
- `--structural` or `$FUNC` / `$$$` in the query → `ast-grep` (STRUCTURAL)
- `--intent UNKNOWN` → `rg` + `ast-grep`
- “who calls” / “impact of” → graph stub (empty matches, no invented edges)

No LLM is used for search.

## JSON

`metrics.origin` is `MEASURED` when tools ran. Missing tools are listed; hits are never invented.

## Tests

```bash
npm test
```

Integration cases skip cleanly if `python3`, `rg`, or `ast-grep` is absent.

Fixtures: `tests/fixtures/repos/python-small`, `tests/fixtures/repos/python-cross-module`.

## Local task worker

Run a text-only task against an already installed local Ollama model. No edits or generated commands are applied:

```bash
npx pudu-ai task run --task "Summarize the authentication flow" --repo . --model auto --json
npx pudu-ai task run --task "Review this repository for risky patterns" --kind code_review --repo . --model qwen3:8b
```

`--kind` accepts `analysis`, `summary`, `code_review`, `test_generation`, or `documentation`; `--model auto` selects deterministically unless local historical telemetry provides structural-verification evidence. An explicit model must already be installed. Example shape (illustrative, not observed output):

```json
{"schemaVersion":1,"ok":true,"op":"task","taskId":"<local-id>","status":"success","model":"<installed-local-model>","content":"<model response>","metrics":{"prompt_tokens":null,"completion_tokens":null,"total_tokens":null}}
```

Verification is structural only and does not establish factual correctness. The worker builds bounded text context, excludes sensitive paths, and never runs model-generated code. Ollama HTTP timeouts are per-operation socket timeouts, not guaranteed end-to-end cancellation. Tasks require `python3` and a running local Ollama service; cloud-tagged models are rejected. Run the source demo with `python3 examples/pycon_local_worker.py`.

Opt-in live test (requires local Ollama and an installed model):

```bash
PUDU_INTEGRATION=1 python3 -m unittest discover -s python/tests -p 'test_task_live.py' -v
```
