import os from "node:os";
import path from "node:path";
import { access } from "node:fs/promises";
import type { ModelRuntime } from "../../runtimes/types.js";
import { scanGgufDirectories } from "../llamacpp/index.js";
import type { LocalModel, ModelArtifact } from "../../models/types.js";

export function lmStudioCandidateDirs(): string[] {
  const home = os.homedir();
  return [
    path.join(home, ".lmstudio", "models"),
    path.join(home, ".cache", "lm-studio", "models"),
    path.join(home, "Library", "Application Support", "LM Studio", "models"),
  ];
}

async function existingDirs(): Promise<string[]> {
  const found: string[] = [];
  for (const dir of lmStudioCandidateDirs()) {
    try {
      await access(dir);
      found.push(dir);
    } catch {
      continue;
    }
  }
  return found;
}

export const lmStudioAdapter: ModelRuntime = {
  id: "lmstudio",
  label: "LM Studio",
  async detect() {
    return (await existingDirs()).length > 0;
  },
  async version() {
    return undefined;
  },
  async listModels() {
    const dirs = await existingDirs();
    return scanGgufDirectories(dirs, { maxDepth: 3, source: "lmstudio" });
  },
  async resolveModel(id: string) {
    const models = await this.listModels();
    const hit = models.find((model) => model.id === id || model.name === id);
    if (!hit?.artifactPath) return undefined;
    return { id: hit.id, path: hit.artifactPath, format: "gguf" } satisfies ModelArtifact;
  },
  async benchmarkCapabilities() {
    return ["llama-bench"];
  },
};

export async function listLmStudioModels(): Promise<LocalModel[]> {
  return lmStudioAdapter.listModels();
}
