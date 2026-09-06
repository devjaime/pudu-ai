export const en = {
  appTitle: "PUDU-AI",
  appSubtitle: "Local AI Hardware & Benchmark Lab",
  nav: "[B] Benchmark  [M] Models  [R] Recommend  [T] Tasks  [H] Hardware  [C] Compare  [L] History  [Q] Quit",
  machine: "MACHINE",
  runtimes: "LOCAL AI RUNTIMES",
  installedModels: "INSTALLED MODELS",
  compatible: "COMPATIBLE (catalog, estimated)",
  recommended: "RECOMMENDED FOR THIS MACHINE",
  recommendedHint:
    "Estimated values come from CanIRun.ai by midudev (canirun.ai · midu.dev) or a local fallback — not measured",
  credits:
    "Measured: llama-bench + OS telemetry. Estimated: CanIRun.ai by midudev (https://canirun.ai, https://github.com/midudev/canirun.ai, https://midu.dev). Labelled separately; never mixed.",
  noModels: "No local models detected",
  notTested: "Not tested",
  detected: "detected",
  notDetected: "not detected",
  unknownMachine: "Unknown machine",
  cpuNa: "CPU N/A",
  selectBenchmark: "Select model to benchmark",
  enterToRun: "Enter to run llama-bench  ·  Esc back",
  noGguf: "No GGUF-resolvable models to benchmark.",
  performance: "PERFORMANCE",
  system: "SYSTEM",
  powerThermals: "POWER / THERMALS",
  elapsed: "Elapsed",
  measuredAfter: "Prompt / generation t/s appear after llama-bench finishes (measured).",
  permissionsHint: "GPU % and power need extra permissions; shown as N/A when not measured.",
  cancelHint: "Ctrl+C / Q cancels llama-bench and telemetry",
  saved: "Saved",
  hardwareHint: "Power, GPU %, and thermals require extra OS permissions and show N/A when unavailable.",
  modelsHint: "FIT and EST. SPEED are estimated. MEASURED comes from local llama-bench history.",
  historyEmpty: "No benchmark history in ~/.pudu-ai/benchmarks",
  compareNeedTwo: "Need at least two measured benchmarks to compare.",
  compareTitle: "LOCAL MODEL BENCHMARKS (measured)",
  winner: "Winner",
  qualityNote: "Quality     (not derived from speed; see catalog metadata)",
  doctorTitle: "Pudu-AI Doctor",
  doctorReady: "Ready to benchmark {count} installed models.",
  doctorNoBench:
    "llama-bench unavailable. Install llama.cpp, e.g. `brew install llama.cpp`. Pudu-AI will not install native dependencies.",
  loading: "Inspecting hardware, runtimes, and local models…",
  addedPath: "Added model path {path}",
  modelNotFound: "Model not found: {id}",
  noHistory: "No benchmark history.",
  jsonNeedModel: "Pass a model id for JSON mode, e.g. npx pudu-ai benchmark qwen3:8b --json",
  useCaseCoding: "Coding",
  useCaseGeneral: "General",
  useCaseReasoning: "Reasoning",
  useCaseLightweight: "Lightweight",
  estimated: "Estimated",
  measured: "Measured",
  scoreLabel: "Pudu-AI Score",
  reportTitle: "Pudu-AI Benchmark",
  benchmarkTitle: "Pudu-AI Benchmark",
  tasksTitle: "TASK HARNESSES",
  tasksHint: "Small OpenCode-style tasks in your selected language. Installed models first. Catalog matches are Estimated (CanIRun.ai by midudev).",
  tasksKinds: "Work types",
  tasksScope: "Scope",
  tasksPriority: "Priority",
  tasksInstalled: "installed",
  tasksNotInstalled: "not installed",
  tasksEmpty: "No matching models for those work types on this machine.",
  tasksQ1: "What do you want to do? (space to toggle, enter next)",
  tasksQ2: "Use only installed models, or also catalog estimates?",
  tasksQ3: "Priority?",
  tasksOptCode: "Code",
  tasksOptVideo: "Video",
  tasksOptImage: "Image",
  tasksOptTranscription: "Transcription",
  tasksOptChat: "Tasks / chat",
  tasksOptInstalled: "Installed only",
  tasksOptAll: "Installed + catalog (estimated)",
  tasksOptSpeed: "Speed",
  tasksOptBalanced: "Balanced",
  tasksOptQuality: "Quality",
  taskCodeReviewTitle: "Review a local diff",
  taskCodeReviewPrompt: "In OpenCode: open a git diff and ask this model to list bugs, missing tests, and a 5-line summary. Do not apply patches unless you ask.",
  taskCodeTestsTitle: "Write one failing test",
  taskCodeTestsPrompt: "Pick one function. Ask the model for a single Vitest/Jest test that fails on the current bug. Do not generate extra files.",
  taskChatPlanTitle: "Turn a goal into a task list",
  taskChatPlanPrompt: "Give the model one goal. Require a numbered plan of 5 harness-sized tasks. No implementation yet.",
  taskChatAgentTitle: "Agent loop on one file",
  taskChatAgentPrompt: "Point the model at one file and one acceptance check. It may edit only that file, then stop.",
  taskImageCaptionTitle: "Caption a local image",
  taskImageCaptionPrompt: "If this is a vision/image model, caption one local image in your UI language. If it is text-only, skip and say N/A.",
  taskImageBriefTitle: "Image generation brief",
  taskImageBriefPrompt: "Ask for a 6-line prompt brief (subject, lens, light, negative prompt) for one still. Do not invent that the model rendered the image unless it did.",
  taskVideoBoardTitle: "8-shot storyboard",
  taskVideoBoardPrompt: "Ask for 8 shots: duration, camera, action, on-screen text. Keep it local. Do not claim a render exists.",
  taskVideoShotTitle: "Shot list from a script",
  taskVideoShotPrompt: "Paste a short script. Ask for a shot list and estimated seconds. Text-only models may plan; they cannot encode video.",
  taskTranscribeCleanTitle: "Clean a transcript",
  taskTranscribeCleanPrompt: "Paste noisy speech-to-text. Ask the model to punctuate, remove fillers, and keep speaker labels. This is not ASR; it edits text.",
  taskTranscribeActionsTitle: "Actions from a transcript",
  taskTranscribeActionsPrompt: "From a meeting transcript, extract owners, due dates, and open questions as a checklist in your UI language.",
  help: `Pudu-AI — local AI hardware & benchmark lab

Usage:
  npx pudu-ai
  npx pudu-ai hardware
  npx pudu-ai models
  npx pudu-ai models add-path ~/Models
  npx pudu-ai recommend
  npx pudu-ai tasks
  npx pudu-ai tasks --for code,image --scope all --priority speed
  npx pudu-ai benchmark [model]
  npx pudu-ai compare
  npx pudu-ai history
  npx pudu-ai doctor
  npx pudu-ai report --markdown

Flags:
  --json          Machine-readable JSON (no TUI)
  --csv           CSV output
  --no-network    Skip CanIRun API; use cache/local estimates
  --no-color      Disable ANSI color
  --verbose       Debug logs to stderr
  --preset        quick | standard | stress
  --lang          en | es
  --for           code,video,image,transcription,chat
  --scope         installed | all
  --priority      speed | balanced | quality

Credits:
  Measured values come from llama-bench and OS telemetry.
  Estimated values come from CanIRun.ai by midudev
  (https://canirun.ai · https://github.com/midudev/canirun.ai · https://midu.dev)
  or a local fallback, and are labelled as such.
`,
} as const;

export type MessageId = keyof typeof en;
