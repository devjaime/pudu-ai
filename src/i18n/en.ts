export const en = {
  appTitle: "PUDU-AI",
  appSubtitle: "Local AI Hardware & Benchmark Lab",
  byline: "by devjaime",
  aboutDashboard:
    "Opens the live lab: your machine, installed models, and estimates. Use it to see what can run here before you benchmark or launch a tool.",
  aboutHardware:
    "Detects CPU, GPU, and Unified Memory/RAM. Use it to know what this computer can host before pulling a model.",
  aboutModels:
    "Lists installed models vs catalog fits. FIT/EST. SPEED are estimated (CanIRun.ai by midudev); MEASURED is llama-bench history. Use it to separate “already here” from “might run”.",
  aboutRecommend:
    "Suggests models by use case for this hardware. Estimates only, unless you already measured. Use it to pick a size class, not a quality score.",
  aboutTasks:
    "Asks what you want (code, video, image, transcription, chat) and returns small OpenCode-style harnesses per model, in this language. Use it to try a model on one concrete job.",
  aboutBenchmark:
    "Runs llama-bench on a local GGUF and records measured t/s plus system telemetry. Use it when you need real numbers, not estimates.",
  aboutCompare:
    "Compares saved measured runs (speed, memory, power). Quality is never inferred from speed. Use it after two or more benchmarks.",
  compareHow:
    "[C] Compare needs two measured llama-bench runs of different models. Press [B], pick a model, wait; repeat with another; then [C]. Quality is not a speed score.",
  compareNeedBench: "Need 2+ measured models. Press [B] to benchmark first.",
  reqOllama: "install: https://ollama.com/download  or  brew install ollama",
  reqLmStudio: "install: https://lmstudio.ai",
  reqDocker: "install: https://docs.docker.com/get-docker/  or  brew install --cask docker",
  dockerHint: "press 4 to run ollama/ollama in Docker",
  dockerStarting: "Starting ollama/ollama container…",
  dockerRunOk: "Docker Ollama is up on port 11434 (name: pudu-ollama).",
  dockerRunFail: "Docker daemon is not running. Open Docker Desktop, wait until it is idle, press 4 again.",
  dockerBrewInstall: "Installing Docker with Homebrew (brew install --cask docker)…",
  dockerDesktopWait: "Starting Docker Desktop and waiting for the daemon…",
  aboutHistory:
    "Shows local benchmark files in ~/.pudu-ai/benchmarks. Use it to replay what this machine actually did.",
  aboutDoctor:
    "Checks Node, Apple Silicon/Metal, Ollama, llama-bench, and the CanIRun API. Use it to see what is missing before a bench or launch.",
  aboutReport:
    "Writes the latest measured run as Markdown. Use it to paste results into GitHub or notes.",
  aboutLaunch:
    "Explains Ollama integrations (OpenCode, OpenClaw, Hermes, Claude Code). Pull/launch only with --yes if the model grade is S–B and speed is enough. Use it to wire a coding agent only when this hardware can carry it.",
  aboutAddPath:
    "Adds a GGUF folder to scan (not the whole disk). Use it so llama-bench can find models outside Ollama.",
  nav: "[S] Setup/Install  [B] Benchmark  [M] Models  [R] Recommend  [T] Tasks  [H] Hardware  [C] Compare  [L] History  [Q] Quit",
  setupTitle: "SETUP — INSTALL MODELS & AGENTS",
  setupIntro:
    "Pick a recommended model (grade S–B), install it with Ollama, then link or install OpenCode, Hermes, or OpenClaw.",
  setupStep1: "1. Recommended models (↑↓ to choose)",
  setupStep2: "2. Install the selected model",
  setupInstallModel: "Press Enter or I  →  ollama pull (only if grade is S, A, or B)",
  setupStep3: "3. Coding agent — link if present, install if missing",
  setupLinkNow: "installed → press 1/2/3 to link this model",
  setupInstallAgent: "not installed → press 1/2/3 to install via ollama launch (if eligible)",
  setupKeys: "Enter/I = pull model    1 OpenCode    2 Hermes    3 OpenClaw    Esc = back",
  setupCta: "[S] Setup: install model + OpenCode / Hermes / OpenClaw",
  machine: "MACHINE",
  runtimes: "LOCAL AI RUNTIMES",
  installedModels: "INSTALLED MODELS",
  compatible: "COMPATIBLE (catalog, estimated)",
  recommended: "RECOMMENDED FOR THIS MACHINE",
  recommendedHint:
    "Estimated values come from CanIRun.ai by midudev (canirun.ai · midu.dev) or a local fallback — not measured",
  recommendKeys: "[↑↓] model  [I] ollama pull if grade S–B  [O] OpenCode  [E] Hermes  [W] OpenClaw  [Esc] back",
  recommendCliHint: "Install: npx pudu-ai recommend --install --yes   Link: npx pudu-ai recommend --link opencode --yes",
  agentsTitle: "CODING AGENTS",
  agentMissing: "not installed — select to install via ollama launch if the model is eligible",
  installGradeBlock: "Grade {grade} is too low to pull. Need S, A, or B.",
  linkingTool: "Linking {tool} with {model}…",
  modelPulled: "Pulled {model} with Ollama.",
  installNone: "No recommended model has grade S–B to install.",
  noOllamaTag:
    "No Ollama library tag for {model}. Catalog names like Agents-A1 are not pullable. Use qwen3:8b, gemma3:4b, qwen3.5:4b, llama3.1:8b.",
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
  launchTitle: "OLLAMA INTEGRATIONS",
  launchHint:
    "Explain-only by default. Pull/install/launch run only with --yes and only if a recommended model fits this hardware (grade S–B; measured speed when available). Docs: OpenCode, OpenClaw, Hermes, Claude Code via Ollama.",
  launchNeedOllama: "Ollama is not detected. Install Ollama first. Pudu-AI will not install it.",
  launchNoModel: "No coding/chat model on this machine meets the hardware bar for this integration.",
  launchGradeFail: "Grade {grade} is below the allowed set ({allowed}).",
  launchSlowFail: "Measured {tps} t/s is below the {min} t/s agent floor.",
  launchEstimateWeak: "Only a weak estimate is available; will not pull or launch.",
  launchOk: "Eligible on this hardware for recommended tasks.",
  launchModel: "Model",
  launchRunHint: "To pull (if needed) and launch: npx pudu-ai launch {tool} --yes",
  launchBlocked: "Blocked. No pull, install, or launch.",
  launchNeedTool: "Pass a tool: opencode | openclaw | hermes | claude",
  launchUnknown: "Unknown integration.",
  launchPulling: "Pulling {model} with ollama pull…",
  launchPullFail: "ollama pull failed.",
  launchExecFail: "ollama launch failed.",
  help: `Pudu-AI — local AI hardware & benchmark lab

Usage:
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
  --yes           Execute pull/launch only if the model is eligible

Credits:
  Measured values come from llama-bench and OS telemetry.
  Estimated values come from CanIRun.ai by midudev
  (https://canirun.ai · https://github.com/midudev/canirun.ai · https://midu.dev)
  or a local fallback, and are labelled as such.
`,
} as const;

export type MessageId = keyof typeof en;
