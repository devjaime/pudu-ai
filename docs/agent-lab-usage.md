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
