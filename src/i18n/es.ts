import type { MessageId } from "./en.js";

export const es: Record<MessageId, string> = {
  appTitle: "PUDU",
  appSubtitle: "Laboratorio local de hardware y benchmarks de IA",
  nav: "[B] Benchmark  [M] Modelos  [R] Recomendaciones  [H] Hardware  [C] Comparar  [L] Historial  [Q] Salir",
  machine: "EQUIPO",
  runtimes: "RUNTIMES DE IA LOCAL",
  installedModels: "MODELOS INSTALADOS",
  compatible: "COMPATIBLES (catálogo, estimado)",
  recommended: "RECOMENDADOS PARA ESTE EQUIPO",
  recommendedHint:
    "Los valores estimados vienen de CanIRun.ai de midudev (canirun.ai · midu.dev) o de un fallback local — no son mediciones",
  credits:
    "Medido: llama-bench + telemetría del SO. Estimado: CanIRun.ai de midudev (https://canirun.ai, https://github.com/midudev/canirun.ai, https://midu.dev). Se etiquetan por separado; nunca se mezclan.",
  noModels: "No se detectaron modelos locales",
  notTested: "Sin probar",
  detected: "detectado",
  notDetected: "no detectado",
  unknownMachine: "Equipo desconocido",
  cpuNa: "CPU N/D",
  selectBenchmark: "Selecciona un modelo para medir",
  enterToRun: "Enter para ejecutar llama-bench  ·  Esc atrás",
  noGguf: "No hay modelos GGUF resolubles para medir.",
  performance: "RENDIMIENTO",
  system: "SISTEMA",
  powerThermals: "ENERGÍA / TÉRMICAS",
  elapsed: "Transcurrido",
  measuredAfter: "Los t/s de prompt y generación aparecen al terminar llama-bench (medidos).",
  permissionsHint: "El % de GPU y la potencia requieren permisos extra; se muestra N/D si no se puede medir.",
  cancelHint: "Ctrl+C / Q cancela llama-bench y la telemetría",
  saved: "Guardado",
  hardwareHint: "Potencia, % de GPU y térmicas requieren permisos extra del SO; si no hay datos se muestra N/D.",
  modelsHint: "FIT y EST. SPEED son estimados. MEASURED sale del historial local de llama-bench.",
  historyEmpty: "No hay historial de benchmarks en ~/.pudu/benchmarks",
  compareNeedTwo: "Se necesitan al menos dos benchmarks medidos para comparar.",
  compareTitle: "BENCHMARKS LOCALES (medidos)",
  winner: "Ganador",
  qualityNote: "Calidad     (no se deriva de la velocidad; ver metadatos del catálogo)",
  doctorTitle: "Pudu Doctor",
  doctorReady: "Listo para medir {count} modelos instalados.",
  doctorNoBench:
    "llama-bench no está disponible. Instala llama.cpp, p. ej. `brew install llama.cpp`. Pudu no instala dependencias nativas.",
  loading: "Inspeccionando hardware, runtimes y modelos locales…",
  addedPath: "Ruta de modelos añadida {path}",
  modelNotFound: "Modelo no encontrado: {id}",
  noHistory: "No hay historial de benchmarks.",
  jsonNeedModel: "Pasa un id de modelo en modo JSON, p. ej. npx pudu benchmark qwen3:8b --json",
  useCaseCoding: "Código",
  useCaseGeneral: "General",
  useCaseReasoning: "Razonamiento",
  useCaseLightweight: "Ligero",
  estimated: "Estimado",
  measured: "Medido",
  scoreLabel: "Puntuación Pudu",
  reportTitle: "Benchmark Pudu",
  benchmarkTitle: "Benchmark Pudu",
  help: `Pudu — laboratorio local de hardware y benchmarks de IA

Uso:
  npx pudu
  npx pudu hardware
  npx pudu models
  npx pudu models add-path ~/Models
  npx pudu recommend
  npx pudu benchmark [model]
  npx pudu compare
  npx pudu history
  npx pudu doctor
  npx pudu report --markdown

Flags:
  --json          JSON legible por máquinas (sin TUI)
  --csv           Salida CSV
  --no-network    Omite la API de CanIRun; usa caché/estimaciones locales
  --no-color      Sin color ANSI
  --verbose       Logs de depuración en stderr
  --preset        quick | standard | stress
  --lang          en | es

Créditos:
  Los valores medidos vienen de llama-bench y de la telemetría del SO.
  Los valores estimados vienen de CanIRun.ai de midudev
  (https://canirun.ai · https://github.com/midudev/canirun.ai · https://midu.dev)
  o de un fallback local, y se etiquetan como tal.
`,
};
