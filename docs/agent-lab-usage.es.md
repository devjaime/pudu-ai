# Uso de Agent Lab (español)

[English](agent-lab-usage.md) · [Español](agent-lab-usage.es.md)

Idioma de la UI: `--lang en` (por defecto) o `--lang es`. Ese flag **no** es el lenguaje de código de ast-grep.

Especificación: [English](spec/agent-lab.md) · [Español](spec/agent-lab.es.md)

## Requisitos

| Herramienta | Hace falta para | Si falta |
| --- | --- | --- |
| Node 20+ | CLI | el CLI no arranca |
| `python3` (3.10+) | `repo search` | error, sin resultados inventados |
| `rg` (ripgrep) | búsqueda TEXT | JSON `tools.rg.available: false` |
| `ast-grep` o `sg` | búsqueda STRUCTURAL | JSON `tools.astGrep.available: false` |

Los comandos de hardware (`hardware`, `benchmark`, …) funcionan sin Python.

## Comandos (iteración 1)

```bash
npx pudu-ai repo
npx pudu-ai repo search validate_user
npx pudu-ai repo search validate_user --repo . --json
npx pudu-ai repo search validate_user --glob '*.py' --limit 20
npx pudu-ai repo search --structural 'def $FUNC($$$ARGS): $$$BODY' --repo .
npx pudu-ai repo search validate_user --intent UNKNOWN --json
npx pudu-ai repo search validate_user --lang es
```

| Flag | Significado |
| --- | --- |
| `--repo PATH` | Raíz del repositorio (por defecto: directorio actual) |
| `--structural PAT` | Patrón ast-grep (STRUCTURAL) |
| `--intent INTENT` | `TEXT` `STRUCTURAL` `RELATIONSHIP` `IMPACT` `SEMANTIC` `UNKNOWN` |
| `--glob GLOB` | Glob de inclusión (repetible) |
| `--limit N` | Máximo de coincidencias (100) |
| `--json` | JSON `SearchResult` |
| `--lang en\|es` | Idioma de la UI |

## Router

- Identificador o mensaje de error → `rg` (TEXT)
- `--structural` o `$FUNC` / `$$$` en la consulta → `ast-grep` (STRUCTURAL)
- `--intent UNKNOWN` → `rg` + `ast-grep`
- “quién llama” / “impacto de” → stub de grafo (sin coincidencias, sin aristas inventadas)

La búsqueda no usa LLM.

## JSON

`metrics.origin` es `MEASURED` cuando corrieron las herramientas. Si falta una herramienta se informa; nunca se inventan hits.

## Tests

```bash
npm test
```

Los casos de integración se omiten si no hay `python3`, `rg` o `ast-grep`.

Fixtures: `tests/fixtures/repos/python-small`, `tests/fixtures/repos/python-cross-module`.
