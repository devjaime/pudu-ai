# Pudu Agent Lab

[English](agent-lab.md) · [Español](agent-lab.es.md)

Observabilidad local, inteligencia de código y benchmarking reproducible de agentes.

Este documento es la especificación de diseño. **La iteración 1 implementa solo la búsqueda de repositorio.** Las fases posteriores se especifican aquí para no inventarlas sobre la marcha. No implementarlas hasta aprobar el diseño.

Especificaciones existentes (no reemplazar):

- `00-overview.md` — laboratorio de hardware/modelos
- `01-architecture.md` — capas del CLI TypeScript, reglas de subprocesos, `~/.pudu-ai/`
- `03-scoring.md` — **Pudu-AI Score** (solo hardware; nunca mezclar calidad de tarea)
- `04-privacy.md` — local-first, `--no-network`

`src/tasks/` es un **planificador de harnesses** estilo OpenCode (qué probar en un LLM local). Las tareas de ingeniería de Agent Lab son otra abstracción: `src/agent-lab/` y `python/pudu_agent/`.

---

## Problema

Los agentes de código fallan o desperdician contexto porque tratan el repositorio como un saco de archivos:

1. Hacen grep ruidoso o meten archivos enteros en el prompt.
2. Pierden hechos estructurales (esto es una *definición*, aquello una *llamada*).
3. No responden preguntas de impacto (quién llama a X, qué tests se rompen).
4. No comparan estrategias de recuperación sobre la misma tarea.
5. Se mezcla velocidad de hardware/modelo (tokens/s) con *calidad de tarea* (tests, contexto usado).

Pudu-AI ya mide **si un modelo local puede correr**. Agent Lab mide **si un agente puede resolver una tarea de software con el mínimo contexto relevante**, usando inteligencia de código determinista antes de cualquier LLM.

Diferenciador:

> OBSERVABILIDAD + INTELIGENCIA DE CÓDIGO + BENCHMARKING REPRODUCIBLE DE AGENTES

Pudu-AI **no** es otro asistente de código genérico.

---

## Principios de diseño

1. **Inspeccionar antes de editar.** Reutilizar parse/dispatch del CLI, `spawnTracked`, `commandExists`, JSON primero, etiquetas estimado vs medido.
2. **Preservar el laboratorio de hardware.** No reescribir TUI, motor de benchmark ni la semántica de Pudu-AI Score.
3. **El CLI TypeScript sigue siendo la aplicación.** Python es un motor de análisis determinista opcional.
4. **Solo JSON estructurado** entre TypeScript y Python. Nunca parsear salida humana si existe `--json` (`rg --json`, `ast-grep --json`).
5. **Herramientas deterministas antes que LLMs.** Un router mapea intención → estrategia. No llamar a un modelo para hacer grep.
6. **No todo agente necesita un LLM.** Grafo y verificador pueden ser 100 % deterministas.
7. **Mínimo contexto, máxima relevancia.** Preferir rangos de símbolos a archivos enteros.
8. **Nunca inventar métricas.** `null` en JSON y `N/A` en texto. Etiquetar **MEASURED** / **ESTIMATED** / **DERIVED**.
9. **Local-first.** Repo, grafo, trazas y prompts en disco. `--no-network` sigue aplicando.
10. **Adaptadores, no forks.** Consumir salida de Graphify si existe. No copiar Graphify ni Oh My OpenAgent.
11. **Lógica de negocio fuera de la TUI.** JSON antes que UI sofisticada.
12. **Omitir, no crashear** si faltan `rg`, `ast-grep`, Graphify u Ollama.
13. **Iteraciones pequeñas.** Iteración 1 = spec + tipos + protocolo + `pudu-ai repo search`.

---

## Por qué rg vs ast-grep vs grafo

Referencias (solo conceptuales): ripgrep, ast-grep, tree-sitter, Graphify, subagentes de OpenCode, Oh My OpenAgent, herramientas locales estilo MCP.

### Búsqueda literal → `rg`

Cuando importan los *bytes*:

- cadenas exactas, valores de config, comentarios, nombres de archivo, mensajes de error, identificadores simples

AST es el default incorrecto aquí: comentarios y YAML/JSON/TOML no son el AST del lenguaje; el scan literal es más barato y completo.

### Búsqueda sintáctica → `ast-grep`

Cuando importa la *forma*:

- definiciones de función/clase vs llamadas
- decoradores, imports, constructos inseguros, candidatos a refactor

Sistemas estilo Oh My OpenAgent separan esto porque `validate_user` como texto pega en comentarios, tests, logs y llamadas; `def $FUNC($$$ARGS): $$$BODY` pega en definiciones. Mezclarlos oculta precisión e infla contexto.

tree-sitter suele estar debajo; Agent Lab llama a **ast-grep** en lugar de incrustar tree-sitter en Node en la iteración 1.

### Relación / impacto → grafo de código

Cuando importa la *arista*:

- quién llama a X, qué depende de Y, qué se rompe si cambia Z
- camino A→B, tests de un componente, exploración arquitectónica

**Graphify (backend A):** si está instalado y existe `graphify-out/graph.json`, consumirlo. Tipos de relación a *mapear* (no inventar): `imports`, `calls`, `inherits`, `references`, `definitions`, más nodos `file`, `module`, `test`. No copiar Graphify.

**PythonLocalGraph (backend B):** `ast` de la stdlib solo para repos Python; escribir `.pudu-ai/code-graph.json`. Toda arista tiene `confidence: EXTRACTED | RESOLVED | INFERRED` y evidencia (`file`, `line`, `symbol`) cuando exista. Nunca inventar aristas.

---

## Arquitectura

```
             Pudu CLI (TypeScript)
                     |
             Orquestador Agent Lab
                     |
       +-------------+-------------+
       |             |             |
     Search        Graph       Metrics
       |             |             |
       v             v             v
  Python tools    Graphify      Almacén de trazas
  ast-grep        adapter       ~/.pudu-ai/tasks
  ripgrep                       .pudu-ai/traces
       |
       v
   Context Pack
       |
       v
    LLM local (opcional por agente)
       |
       v
   Mini agentes
       |
       v
 Test / Lint / Build
       |
       v
    Task Score
```

### Frontera de proceso

```
TypeScript  --stdin JSON-->  python -m pudu_agent
            <--stdout JSON--
```

- Timeout en cada exec (`spawnTracked`).
- PYTHONPATH apunta a `python/` empaquetado.
- Python es opcional: los comandos de hardware deben seguir funcionando sin Python.
- Los comandos de Agent Lab **no** deben llamar a `loadSession` (sin escaneo de hardware/modelo/CanIRun).

### Capas (añadidas)

| Capa | Ruta | ¿UI? |
| --- | --- | --- |
| Tipos / CLI Agent Lab | `src/agent-lab` | no |
| Motor Python | `python/pudu_agent` | no |
| Trazas (después) | `.pudu-ai/traces`, `~/.pudu-ai/tasks` | no |

---

## Diseño del CLI

Namespaces (objetivo; * = iteración 1):

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

Flags globales cuando aplique: `--json`, `--no-network`, `--verbose`, `--no-color`.

Flags de repo (iteración 1):

| Flag | Significado |
| --- | --- |
| `--repo PATH` | Raíz del repositorio (por defecto: cwd) |
| `--structural PATTERN` | Patrón ast-grep; intención STRUCTURAL |
| `--intent TEXT\|STRUCTURAL\|...` | Forzar el router |
| `--glob GLOB` | Glob de inclusión (repetible) |
| `--limit N` | Máximo de coincidencias (100) |

`--lang` sigue siendo **idioma de UI** (`en` \| `es`). No usarlo como `--lang` de ast-grep.

---

## Router de búsqueda

```
SearchIntent =
    TEXT | STRUCTURAL | RELATIONSHIP | IMPACT | SEMANTIC | UNKNOWN
```

| Intención | Estrategia | Iteración 1 |
| --- | --- | --- |
| TEXT | `rg` | sí |
| STRUCTURAL | `ast-grep` | sí |
| RELATIONSHIP | grafo | stub: vacío + error, sin aristas falsas |
| IMPACT | grafo | stub |
| SEMANTIC | después (el router sigue sin LLM) | stub |
| UNKNOWN | `rg` + `ast-grep` | sí |

Identificador o mensaje de error: **TEXT**. Metavariables (`$FUNC`, `$$$ARGS`) o `--structural`: **STRUCTURAL**. `--intent UNKNOWN`: híbrido. Las intenciones de grafo no caen a un LLM.

---

## Modelo de datos

JSON en **camelCase** como `BenchmarkRecord`. Python puede usar snake_case por dentro. Valores no disponibles: `null`, nunca adivinados.

Origen de cada métrica que pueda faltar:

`MEASURED` | `ESTIMATED` | `DERIVED`

Tipos canónicos: `src/agent-lab/types.ts`.

### SearchResult (iteración 1)

Coincidencias, disponibilidad de herramientas, errores, `durationMs` / `matchCount` como MEASURED.

### ContextPack (después)

`task`, `strategy`, `symbols`, `files` (preferir rangos), `relationships`, `tests`, `tokenEstimate`, `contextWindow`, `contextUtilization`, `searchTrace`.

### AgentRun (después)

Roles: `scout` | `graph` | `context` | `builder` | `verifier`.

### TaskTrace (después)

En `.pudu-ai/traces/<timestamp>-<task-id>.json` o `~/.pudu-ai/tasks/`. Incluye commit git, conteos de búsqueda, reducción de contexto, tokens LLM, llamadas a herramientas, archivos tocados, verificación. Lo que falte queda `null`.

### TaskMetrics (después)

**Pudu Task Score** (0.00–1.00), separado del Pudu-AI Score de hardware:

| Dimensión | Peso |
| --- | --- |
| Éxito de verificación | 40% |
| Rúbrica de tarea | 25% |
| Eficiencia de contexto | 15% |
| Eficiencia de herramientas | 10% |
| Penalización por reintentos | 10% |

La corrección manda: la eficiencia de contexto no compensa tests fallidos.

**Pudu Task Effort** es un proxy de ingeniería DERIVED (herramientas, tokens, tiempo de pared, búsquedas, archivos, reintentos, ciclos de verificación, intervenciones humanas). Etiquetas: LOW / MEDIUM / HIGH / VERY_HIGH y opcional 0–100. **No** es esfuerzo cognitivo.

`--human-baseline-minutes` lo aporta el usuario. Si falta: línea base humana `N/A`. Nunca inventarla.

---

## Metodología de medición

| Cantidad | Origen |
| --- | --- |
| Conteos, duraciones y códigos de `rg`/ast-grep | MEASURED |
| Herramienta ausente | MEASURED availability=false; no se inventan resultados |
| Tokens del repo sin tokenizer real | ESTIMATED, etiquetado Estimated |
| Utilización de contexto = seleccionado / ventana | DERIVED |
| Task Score / Effort | DERIVED a partir de trazas medidas |
| Línea base humana | input del usuario o N/A |

Observabilidad de ventana de contexto (después) por modelo/agente: input, output, total, ventana, % de uso, tokens restantes, % de reducción del repositorio.

---

## Metodología experimental

`pudu-ai experiment` ejecuta la **misma tarea** con estrategias: `raw`, `rg`, `ast`, `graph`, `hybrid`, `hybrid-multi-agent`.

Todos los valores salen de trazas reales. El modo mock/demo debe etiquetarse. Demos (PyCon) solo con repos públicos o sintéticos: demostrar que mejor recuperación determinista usa mucho menos contexto, no que “la IA escribe código”.

---

## Ecosistema de mini-agentes (después)

Cinco roles, en secuencia: Scout → Graph → Context → Builder → Verifier.

Scout/Graph/Context: sin editar archivos. Builder puede editar y recibe solo el ContextPack. Verifier corre pytest/lint/typecheck/build; no toca código de producción salvo autorización.

Medir si delegar ayuda o perjudica. No añadir agentes por añadir.

Mapeo de modelo por agente (después): muchos roles `deterministic`. Preferir Ollama / llama.cpp ya detectados por el lab de hardware.

---

## Garantías de privacidad

Por defecto:

- repositorio, grafo, trazas y context packs se quedan locales
- sin subida de telemetría ni de código
- los prompts se quedan locales con modelos locales
- `--no-network` corta peticiones salientes (igual que el lab de hardware)
- proveedores cloud futuros: opt-in explícito

Agent Lab no envía el repo a CanIRun ni a ninguna API de catálogo.

---

## Limitaciones

- La iteración 1 no construye grafos, context packs, agentes, trazas ni scores.
- Python, `rg` y `ast-grep` son opcionales; la búsqueda se degrada u omite.
- Graphify puede no estar; PythonLocalGraph es solo Python.
- Los patrones de ast-grep son por lenguaje de código; `--lang` de UI no es el lenguaje de ast-grep.
- La búsqueda semántica no está especificada más allá de “el router no es un LLM”.
- Los conteos de tokens pueden ser ESTIMATED hasta cablear un tokenizer real.
- El paquete npm debe incluir `python/` junto al CLI empaquetado (`import.meta.url` → `../../python`).

---

## Alcance de la iteración 1 (este cambio)

Incluye:

- esta especificación
- interfaces TypeScript
- protocolo JSON de Python
- adaptadores `rg` + `ast-grep`
- `pudu-ai repo search`
- fixtures + tests
- notas de uso

Fuera (hace falta aprobación explícita):

- Fase 2 grafo y `repo explain|path|callers|dependencies|impact`
- Fases 3–12 contexto, agentes, trazas, esfuerzo, experiment, task score, demo
- TUI para Agent Lab
