import os from "node:os";
import path from "node:path";
import { ollamaAdapter } from "../adapters/ollama/index.js";
import { scanGgufDirectories } from "../adapters/llamacpp/index.js";
import { loadConfig } from "../storage/config.js";
import type { LocalModel } from "./types.js";

function defaultGgufDirs(): string[] {
  const home = os.homedir();
  return [
    path.join(home, "Models"),
    path.join(home, "models"),
    path.join(home, ".cache", "llama.cpp"),
    path.join(home, ".local", "share", "llama.cpp"),
  ];
}

export async function discoverLocalModels(): Promise<LocalModel[]> {
  const config = await loadConfig();
  const ollama = await ollamaAdapter.listModels();
  const gguf = await scanGgufDirectories([...defaultGgufDirs(), ...config.modelPaths]);
  const seen = new Set<string>();
  const merged: LocalModel[] = [];
  for (const model of [...ollama, ...gguf]) {
    const key = `${model.source}:${model.id}:${model.artifactPath ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(model);
  }
  return merged;
}
