import { ollamaAdapter } from "../adapters/ollama/index.js";
import { llamaCppAdapter } from "../adapters/llamacpp/index.js";
import { lmStudioAdapter } from "../adapters/lmstudio/index.js";
import { mlxAdapter } from "../adapters/mlx/index.js";
import { commandExists } from "../shared/which.js";
import type { ModelRuntime, RuntimeStatus } from "./types.js";

export const runtimes: ModelRuntime[] = [ollamaAdapter, llamaCppAdapter, lmStudioAdapter, mlxAdapter];

export async function detectRuntimes(): Promise<RuntimeStatus[]> {
  const llamaBench = Boolean(await commandExists("llama-bench"));
  const statuses: RuntimeStatus[] = [];
  for (const runtime of runtimes) {
    const detected = await runtime.detect();
    const version = detected ? await runtime.version() : undefined;
    statuses.push({ id: runtime.id, label: runtime.label, detected, version });
  }
  statuses.push({
    id: "llama-bench",
    label: "llama-bench",
    detected: llamaBench,
  });
  statuses.push({
    id: "docker",
    label: "Docker",
    detected: Boolean(await commandExists("docker")),
  });
  return statuses;
}

export function getRuntime(id: string): ModelRuntime | undefined {
  return runtimes.find((runtime) => runtime.id === id);
}
