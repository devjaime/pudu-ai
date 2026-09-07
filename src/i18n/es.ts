import type { MessageId } from "./en.js";

export const es: Record<MessageId, string> = {
  appTitle: "PUDU-AI",
  appSubtitle: "Laboratorio local de hardware y benchmarks de IA",
  byline: "by devjaime",
  aboutDashboard:
    "Abre el laboratorio en vivo: equipo, modelos instalados y estimaciones. Sirve para ver qué puede correr aquí antes de medir o lanzar una herramienta.",
  aboutHardware:
    "Detecta CPU, GPU y memoria unificada/RAM. Sirve para saber qué puede hospedar este equipo antes de descargar un modelo.",
  aboutModels:
    "Lista instalados frente al catálogo. FIT/EST. SPEED son estimados (CanIRun.ai de midudev); MEASURED es historial de llama-bench. Sirve para separar “ya está” de “podría correr”.",
  aboutRecommend:
    "Sugiere modelos por caso de uso para este hardware. Solo estimaciones, salvo que ya hayas medido. Sirve para elegir un tamaño, no una nota de calidad.",
  aboutTasks:
    "Pregunta qué quieres (código, vídeo, imagen, transcripción, chat) y devuelve harnesses pequeños estilo OpenCode por modelo, en este idioma. Sirve para probar un modelo en una tarea concreta.",
  aboutBenchmark:
    "Ejecuta llama-bench sobre un GGUF local y guarda t/s medidos más telemetría. Sirve cuando necesitas números reales, no estimaciones.",
  aboutCompare:
    "Compara corridas medidas (velocidad, memoria, potencia). La calidad no se infiere de la velocidad. Sirve después de dos o más benchmarks.",
  aboutHistory:
    "Muestra los JSON locales en ~/.pudu-ai/benchmarks. Sirve para ver qué hizo realmente esta máquina.",
  aboutDoctor:
    "Revisa Node, Apple Silicon/Metal, Ollama, llama-bench y la API de CanIRun. Sirve para ver qué falta antes de un bench o un launch.",
  aboutReport:
    "Exporta la última corrida medida en Markdown. Sirve para pegar resultados en GitHub o notas.",
  aboutLaunch:
    "Explica las integraciones de Ollama (OpenCode, OpenClaw, Hermes, Claude Code). Pull/launch solo con --yes si la nota es S–B y hay velocidad suficiente. Sirve para conectar un agente de código solo cuando el hardware lo aguanta.",
  aboutAddPath:
    "Añade una carpeta GGUF a escanear (no todo el disco). Sirve para que llama-bench encuentre modelos fuera de Ollama.",
  nav: "[S] Setup/Instalar  [B] Benchmark  [M] Modelos  [R] Recomendaciones  [T] Tareas  [H] Hardware  [C] Comparar  [L] Historial  [Q] Salir",
  setupTitle: "SETUP — INSTALAR MODELOS Y AGENTES",
  setupIntro:
    "Elige un modelo recomendado (nota S–B), instálalo con Ollama y luego vincula o instala OpenCode, Hermes u OpenClaw.",
  setupStep1: "1. Modelos recomendados (↑↓ para elegir)",
  setupStep2: "2. Instalar el modelo seleccionado",
  setupInstallModel: "Enter o I  →  ollama pull (solo si la nota es S, A o B)",
  setupStep3: "3. Agente de código — vincular si existe, instalar si falta",
  setupLinkNow: "instalado → pulsa 1/2/3 para vincular este modelo",
  setupInstallAgent: "no instalado → pulsa 1/2/3 para instalar con ollama launch (si es elegible)",
  setupKeys: "Enter/I = descargar modelo    1 OpenCode    2 Hermes    3 OpenClaw    Esc = atrás",
  setupCta: "[S] Setup: instalar modelo + OpenCode / Hermes / OpenClaw",
  machine: "EQUIPO",
  runtimes: "RUNTIMES DE IA LOCAL",
  installedModels: "MODELOS INSTALADOS",
  compatible: "COMPATIBLES (catálogo, estimado)",
  recommended: "RECOMENDADOS PARA ESTE EQUIPO",
  recommendedHint:
    "Los valores estimados vienen de CanIRun.ai de midudev (canirun.ai · midu.dev) o de un fallback local — no son mediciones",
  recommendKeys: "[↑↓] modelo  [I] ollama pull si nota S–B  [O] OpenCode  [E] Hermes  [W] OpenClaw  [Esc] atrás",
  recommendCliHint: "Instalar: npx pudu-ai recommend --install --yes   Vincular: npx pudu-ai recommend --link opencode --yes",
  agentsTitle: "AGENTES DE CÓDIGO",
  agentMissing: "no instalado — selecciónalo para instalar con ollama launch si el modelo es elegible",
  installGradeBlock: "La nota {grade} es baja para hacer pull. Hace falta S, A o B.",
  linkingTool: "Vinculando {tool} con {model}…",
  modelPulled: "Descargado {model} con Ollama.",
  installNone: "Ningún modelo recomendado tiene nota S–B para instalar.",
  noOllamaTag:
    "No hay tag de Ollama para {model}. Nombres de catálogo como Agents-A1 no se pueden descargar. Usa qwen3:8b, gemma3:4b, qwen3.5:4b, llama3.1:8b.",
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
  historyEmpty: "No hay historial de benchmarks en ~/.pudu-ai/benchmarks",
  compareNeedTwo: "Se necesitan al menos dos benchmarks medidos para comparar.",
  compareTitle: "BENCHMARKS LOCALES (medidos)",
  winner: "Ganador",
  qualityNote: "Calidad     (no se deriva de la velocidad; ver metadatos del catálogo)",
  doctorTitle: "Pudu-AI Doctor",
  doctorReady: "Listo para medir {count} modelos instalados.",
  doctorNoBench:
    "llama-bench no está disponible. Instala llama.cpp, p. ej. `brew install llama.cpp`. Pudu-AI no instala dependencias nativas.",
  loading: "Inspeccionando hardware, runtimes y modelos locales…",
  addedPath: "Ruta de modelos añadida {path}",
  modelNotFound: "Modelo no encontrado: {id}",
  noHistory: "No hay historial de benchmarks.",
  jsonNeedModel: "Pasa un id de modelo en modo JSON, p. ej. npx pudu-ai benchmark qwen3:8b --json",
  useCaseCoding: "Código",
  useCaseGeneral: "General",
  useCaseReasoning: "Razonamiento",
  useCaseLightweight: "Ligero",
  estimated: "Estimado",
  measured: "Medido",
  scoreLabel: "Puntuación Pudu-AI",
  reportTitle: "Benchmark Pudu-AI",
  benchmarkTitle: "Benchmark Pudu-AI",
  tasksTitle: "HARNESSES DE TAREAS",
  tasksHint:
    "Tareas pequeñas estilo OpenCode en tu idioma. Primero modelos instalados. El catálogo es Estimado (CanIRun.ai de midudev).",
  tasksKinds: "Tipos de trabajo",
  tasksScope: "Alcance",
  tasksPriority: "Prioridad",
  tasksInstalled: "instalado",
  tasksNotInstalled: "no instalado",
  tasksEmpty: "No hay modelos que coincidan con esos tipos de trabajo en este equipo.",
  tasksQ1: "¿Qué quieres hacer? (espacio para marcar, enter para seguir)",
  tasksQ2: "¿Solo modelos instalados, o también estimaciones del catálogo?",
  tasksQ3: "¿Prioridad?",
  tasksOptCode: "Código",
  tasksOptVideo: "Vídeo",
  tasksOptImage: "Imagen",
  tasksOptTranscription: "Transcripción",
  tasksOptChat: "Tareas / chat",
  tasksOptInstalled: "Solo instalados",
  tasksOptAll: "Instalados + catálogo (estimado)",
  tasksOptSpeed: "Velocidad",
  tasksOptBalanced: "Equilibrado",
  tasksOptQuality: "Calidad",
  taskCodeReviewTitle: "Revisar un diff local",
  taskCodeReviewPrompt:
    "En OpenCode: abre un git diff y pide a este modelo bugs, tests faltantes y un resumen de 5 líneas. No apliques parches salvo que lo pidas.",
  taskCodeTestsTitle: "Escribir un test que falle",
  taskCodeTestsPrompt:
    "Elige una función. Pide un solo test Vitest/Jest que falle con el bug actual. No generes archivos extra.",
  taskChatPlanTitle: "Convertir un objetivo en tareas",
  taskChatPlanPrompt:
    "Dale un objetivo. Exige un plan numerado de 5 tareas tamaño harness. Sin implementar todavía.",
  taskChatAgentTitle: "Bucle de agente en un archivo",
  taskChatAgentPrompt:
    "Señala un archivo y un criterio de aceptación. Solo puede editar ese archivo y luego parar.",
  taskImageCaptionTitle: "Describir una imagen local",
  taskImageCaptionPrompt:
    "Si es un modelo de visión/imagen, describe una imagen local en el idioma de la UI. Si es solo texto, indica N/D.",
  taskImageBriefTitle: "Brief de generación de imagen",
  taskImageBriefPrompt:
    "Pide un brief de 6 líneas (sujeto, lente, luz, negative prompt) para un still. No inventes que el modelo renderizó la imagen.",
  taskVideoBoardTitle: "Storyboard de 8 planos",
  taskVideoBoardPrompt:
    "Pide 8 planos: duración, cámara, acción, texto en pantalla. Local. No afirmes que existe un render.",
  taskVideoShotTitle: "Lista de planos desde un guion",
  taskVideoShotPrompt:
    "Pega un guion corto. Pide lista de planos y segundos estimados. Un modelo de texto puede planear; no puede encodear vídeo.",
  taskTranscribeCleanTitle: "Limpiar una transcripción",
  taskTranscribeCleanPrompt:
    "Pega texto de speech-to-text ruidoso. Pide puntuación, quitar muletillas y mantener hablantes. Esto no es ASR; edita texto.",
  taskTranscribeActionsTitle: "Acciones desde una transcripción",
  taskTranscribeActionsPrompt:
    "De una reunión transcrita, extrae responsables, fechas y preguntas abiertas como checklist en el idioma de la UI.",
  launchTitle: "INTEGRACIONES OLLAMA",
  launchHint:
    "Por defecto solo explica. Pull/instalación/launch solo con --yes y solo si un modelo recomendado cabe en este hardware (nota S–B; velocidad medida si existe). Docs: OpenCode, OpenClaw, Hermes, Claude Code vía Ollama.",
  launchNeedOllama: "Ollama no está detectado. Instálalo primero. Pudu-AI no lo instala.",
  launchNoModel: "Ningún modelo de código/chat en este equipo cumple el umbral de hardware para esta integración.",
  launchGradeFail: "La nota {grade} está por debajo del conjunto permitido ({allowed}).",
  launchSlowFail: "Los {tps} t/s medidos están por debajo del mínimo de agente ({min} t/s).",
  launchEstimateWeak: "Solo hay una estimación débil; no se hará pull ni launch.",
  launchOk: "Elegible en este hardware para las tareas recomendadas.",
  launchModel: "Modelo",
  launchRunHint: "Para hacer pull (si hace falta) y lanzar: npx pudu-ai launch {tool} --yes",
  launchBlocked: "Bloqueado. Sin pull, instalación ni launch.",
  launchNeedTool: "Indica una herramienta: opencode | openclaw | hermes | claude",
  launchUnknown: "Integración desconocida.",
  launchPulling: "Descargando {model} con ollama pull…",
  launchPullFail: "Falló ollama pull.",
  launchExecFail: "Falló ollama launch.",
  help: `Pudu-AI — laboratorio local de hardware y benchmarks de IA

Uso:
  npx pudu-ai
  npx pudu-ai hardware
  npx pudu-ai models
  npx pudu-ai models add-path ~/Models
  npx pudu-ai setup
  npx pudu-ai recommend
  npx pudu-ai recommend --install --yes
  npx pudu-ai recommend --link opencode --yes
  npx pudu-ai tasks
  npx pudu-ai tasks --for code,image --scope all --priority speed
  npx pudu-ai benchmark [model]
  npx pudu-ai compare
  npx pudu-ai history
  npx pudu-ai doctor
  npx pudu-ai report --markdown
  npx pudu-ai launch
  npx pudu-ai launch opencode
  npx pudu-ai launch opencode --yes

Flags:
  --json          JSON legible por máquinas (sin TUI)
  --csv           Salida CSV
  --no-network    Omite la API de CanIRun; usa caché/estimaciones locales
  --no-color      Sin color ANSI
  --verbose       Logs de depuración en stderr
  --preset        quick | standard | stress
  --lang          en | es
  --for           code,video,image,transcription,chat
  --scope         installed | all
  --priority      speed | balanced | quality
  --yes           Ejecuta pull/launch solo si el modelo es elegible

Créditos:
  Los valores medidos vienen de llama-bench y de la telemetría del SO.
  Los valores estimados vienen de CanIRun.ai de midudev
  (https://canirun.ai · https://github.com/midudev/canirun.ai · https://midu.dev)
  o de un fallback local, y se etiquetan como tal.
`,
};
