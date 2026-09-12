# Pudu-AI

**Laboratorio local de hardware y benchmarks de IA** para la terminal.

[English](README.md) · [Español](README.es.md)

Descubre, inspecciona, mide y compara modelos que corren en tu máquina. Las mediciones se quedan locales. Las estimaciones nunca se mezclan con resultados reales de `llama-bench`.

```bash
npx pudu-ai --lang es
```

El idioma de la UI por defecto es inglés. Usa `--lang es` para español.

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
npx pudu-ai repo search validate_user --json
npx pudu-ai repo search --structural 'def $FUNC($$$ARGS): $$$BODY' --repo .
```

Flags: `--json` `--csv` `--no-network` `--no-color` `--verbose` `--preset` `--lang en|es` `--repo` `--structural` `--intent` `--glob` `--limit`

## Agent Lab (vista previa)

Búsqueda determinista de repositorio. Python 3.10+, `rg` y `ast-grep` opcionales. Sin LLM.

- Uso: [Español](docs/agent-lab-usage.es.md) · [English](docs/agent-lab-usage.md)
- Spec: [Español](docs/spec/agent-lab.es.md) · [English](docs/spec/agent-lab.md)

```bash
npx pudu-ai repo search validate_user --repo . --json --lang es
```

Hace falta `python3` en PATH. Si faltan `rg` o `ast-grep`, el JSON dice `available: false`; no inventa coincidencias.

La iteración 1 solo incluye `repo search`. Grafo, context pack y agentes aún no.

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
