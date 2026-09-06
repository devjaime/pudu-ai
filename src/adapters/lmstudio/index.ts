import os from "node:os";
import path from "node:path";
import { access } from "node:fs/promises";
import type { ModelRuntime } from "../../runtimes/types.js";

function candidateDirs(): string[] {
  const home = os.homedir();
  return [
    path.join(home, ".lmstudio", "models"),
    path.join(home, ".cache", "lm-studio", "models"),
    path.join(home, "Library", "Application Support", "LM Studio", "models"),
  ];
}

export const lmStudioAdapter: ModelRuntime = {
  id: "lmstudio",
  label: "LM Studio",
  async detect() {
    for (const dir of candidateDirs()) {
      try {
        await access(dir);
        return true;
      } catch {
        continue;
      }
    }
    return false;
  },
  async version() {
    return undefined;
  },
  async listModels() {
    return [];
  },
  async resolveModel() {
    return undefined;
  },
  async benchmarkCapabilities() {
    return ["none"];
  },
};
