export const en = {
  appTitle: "PUDU",
  appSubtitle: "Local AI Hardware & Benchmark Lab",
  nav: "[B] Benchmark  [M] Models  [R] Recommend  [H] Hardware  [C] Compare  [L] History  [Q] Quit",
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
  historyEmpty: "No benchmark history in ~/.pudu/benchmarks",
  compareNeedTwo: "Need at least two measured benchmarks to compare.",
  compareTitle: "LOCAL MODEL BENCHMARKS (measured)",
  winner: "Winner",
  qualityNote: "Quality     (not derived from speed; see catalog metadata)",
  doctorTitle: "Pudu Doctor",
  doctorReady: "Ready to benchmark {count} installed models.",
  doctorNoBench:
    "llama-bench unavailable. Install llama.cpp, e.g. `brew install llama.cpp`. Pudu will not install native dependencies.",
  loading: "Inspecting hardware, runtimes, and local models…",
  addedPath: "Added model path {path}",
  modelNotFound: "Model not found: {id}",
  noHistory: "No benchmark history.",
  jsonNeedModel: "Pass a model id for JSON mode, e.g. npx pudu benchmark qwen3:8b --json",
  useCaseCoding: "Coding",
  useCaseGeneral: "General",
  useCaseReasoning: "Reasoning",
  useCaseLightweight: "Lightweight",
  estimated: "Estimated",
  measured: "Measured",
  scoreLabel: "Pudu Score",
  reportTitle: "Pudu Benchmark",
  benchmarkTitle: "Pudu Benchmark",
  help: `Pudu — local AI hardware & benchmark lab

Usage:
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
  --json          Machine-readable JSON (no TUI)
  --csv           CSV output
  --no-network    Skip CanIRun API; use cache/local estimates
  --no-color      Disable ANSI color
  --verbose       Debug logs to stderr
  --preset        quick | standard | stress
  --lang          en | es

Credits:
  Measured values come from llama-bench and OS telemetry.
  Estimated values come from CanIRun.ai by midudev
  (https://canirun.ai · https://github.com/midudev/canirun.ai · https://midu.dev)
  or a local fallback, and are labelled as such.
`,
} as const;

export type MessageId = keyof typeof en;
