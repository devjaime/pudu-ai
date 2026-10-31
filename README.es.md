# Pudu-AI

**Laboratorio local de hardware y benchmarks de IA** para la terminal.

[English](README.md) · [Español](README.es.md)

Descubre, inspecciona, mide y compara modelos que corren en tu máquina. Las mediciones se quedan locales. Las estimaciones nunca se mezclan con resultados reales de `llama-bench`.

```bash
npx pudu-ai --lang es
```

El idioma de la UI por defecto es inglés. Usa `--lang es` para español.

> **PyCon 2026:** una herramienta Python que solo usa la biblioteca estándar (`python/pudu_agent`) recorre el AST de un checkout fijado de `huggingface/transformers` y reúne evidencia acotada y citable sobre el impacto de `GenerationMixin.generate`. Los modelos locales son una segunda capa opcional. Ver la [sección de la demo](#demo-pycon-2026-transformers--ollama) y el [runbook de presentación](docs/demos/pycon-2026/DEMO_RUNBOOK.es.md).

El nombre npm `pudu` está ocupado. Este CLI es **`pudu-ai`**.

## Instalar

```bash
git clone https://github.com/devjaime/pudu-ai.git
cd pudu-ai
npm install
npx . --lang es
```

O:

```bash
npm run pudu-ai -- --lang es
```

`PUDU_AI_LANG=es` o un `LANG` español (p. ej. `es_CL.UTF-8`) también seleccionan español.

## Comandos

```bash
npx pudu-ai --lang es
npx pudu-ai hardware
npx pudu-ai models
npx pudu-ai setup
npx pudu-ai recommend
npx pudu-ai tasks --for code --lang es
npx pudu-ai benchmark qwen3:8b --json --preset quick
npx pudu-ai doctor --lang es
npx pudu-ai launch opencode
npx pudu-ai launch antigravity --lang es
npx pudu-ai launch antigravity gemma4:e4b --out ./antigravity.local.json --yes
npx pudu-ai repo search validate_user --json
npx pudu-ai repo search --structural 'def $FUNC($$$ARGS): $$$BODY' --repo .
npx pudu-ai repo graph --vault ~/vault --json --lang es
```

Flags: `--json` `--csv` `--no-network` `--no-color` `--verbose` `--preset` `--lang en|es` `--repo` `--structural` `--intent` `--glob` `--limit` `--vault` `--out` `--from` `--yes`

## Agent Lab (vista previa)

Búsqueda determinista de repositorio. Python 3.10+, `rg` y `ast-grep` opcionales. Sin LLM.

- Uso: [Español](docs/agent-lab-usage.es.md) · [English](docs/agent-lab-usage.md)
- Spec: [Español](docs/spec/agent-lab.es.md) · [English](docs/spec/agent-lab.md)

```bash
npx pudu-ai repo search validate_user --repo . --json --lang es
npx pudu-ai repo graph --vault ~/vault --out /tmp/pudu-obsidian --yes --lang es
```

Hace falta `python3` en PATH para la búsqueda y el grafo AST. El grafo de bóveda y el export a Obsidian no. Si faltan `rg` o `ast-grep`, el JSON dice `available: false`; no inventa coincidencias.

En el TUI, **[S] Setup** y **[7]** instala Antigravity con `brew install --cask antigravity`, o lo abre si ya está. No hace curl-pipe ni arranca un agente. `launch antigravity` solo explica si un Gemma 4 local cabe; escribe la config de loopback con `--yes` y `--out`. Un tag `:cloud` queda bloqueado. Spec: `docs/spec/05-local-workbench.es.md`.

## Worker de tareas local (experimental)

Ejecuta tareas de texto con un modelo Ollama local. El contexto del repositorio es acotado; no aplica ediciones ni ejecuta comandos generados, y rechaza los tags de modelos cloud.

```bash
npx pudu-ai task run --task "Resume el flujo de autenticación" --repo . --model auto --json --no-network
```

La prueba de integración con Ollama es opt-in (`PUDU_INTEGRATION=1`). Ver la [guía en español](docs/agent-lab-usage.es.md), la [guía en inglés](docs/agent-lab-usage.md) y el [diagrama del flujo](docs/diagrams/local-task-worker-flow.html).

## Demo PyCon 2026: Transformers + Ollama

**Qué muestra:** antes de modificar `GenerationMixin.generate`, un recolector determinista (`pudu_agent.transformers_evidence`) verifica el fixture fijado (`v5.20.2`, `18329f10…`). Luego usa el módulo `ast` de Python para encontrar la definición, una llamada, candidatos de herencia, la configuración pública y referencias de pruebas. El [informe de evidencia](docs/demos/pycon-2026/evidence/report.md) cita 13 archivos: 3.682 bytes de metadatos frente a 816.502 bytes de archivos completos. Son bytes, no tokens. El impacto en tiempo de ejecución no queda demostrado: `RUNTIME_TESTS` y `MODEL_ANALYSIS` siguen como `NOT_RUN` en la captura. Después, un modelo Ollama local puede interpretar esa evidencia acotada, y su respuesta se trata como no verificada.

**Acceso rápido web:** en la Terminal 1, confirma que el puerto `11435` esté libre e inicia una instancia Ollama separada con `OLLAMA_HOST=127.0.0.1:11435 OLLAMA_NO_CLOUD=1 ollama serve`. En la Terminal 2, desde la raíz del repositorio, ejecuta `OLLAMA_HOST=127.0.0.1:11435 ollama list` y usa solo un modelo que ya aparezca allí. Luego inicia la web con `PYTHONPATH=python python3 -m pudu_agent.pycon_web --ollama-url http://127.0.0.1:11435 --port 8765` y abre [http://127.0.0.1:8765](http://127.0.0.1:8765). El servidor web no inicia ni detiene Ollama, y tampoco descarga modelos. Si el fixture no está en `/Volumes/KINGSTON/pudu-pycon-2026/transformers`, exporta `PUDU_TRANSFORMERS_FIXTURE` con su ruta absoluta.

El [runbook de presentación](docs/demos/pycon-2026/DEMO_RUNBOOK.es.md) incluye la verificación del fixture, la regeneración del informe, las pruebas, el video y el fallback por CLI directa.

## Privacidad

Local-first. Benchmarks, rutas de modelos e identificadores de máquina se quedan en `~/.pudu-ai/`. Nada se sube. La red es opcional (catálogo CanIRun; `--no-network` la desactiva). Agent Lab no envía el repositorio a ninguna API.

## Puntuación

**Pudu-AI Score** es solo rendimiento de hardware. No incluye calidad/inteligencia del modelo. Ver `docs/spec/03-scoring.md`.

**Pudu Task Score** (Agent Lab, aún no implementado) será otra métrica, separada.

## Créditos

**Medido:** `llama-bench` y telemetría del SO.

**Estimado:** [CanIRun.ai](https://canirun.ai) de [midudev](https://midu.dev) ([GitHub](https://github.com/midudev/canirun.ai)), siempre etiquetado como estimado.

## Contribuir

Ver [CONTRIBUTING.md](CONTRIBUTING.md). Licencia MIT.
