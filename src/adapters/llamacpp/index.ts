import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { commandExists } from "../../shared/which.js";
import type { ModelRuntime } from "../../runtimes/types.js";
import type { LocalModel, ModelArtifact } from "../../models/types.js";

const BINARIES = ["llama-bench", "llama-cli", "llama-server"] as const;

export async function detectLlamaCpp(): Promise<Record<(typeof BINARIES)[number], boolean>> {
  const entries = await Promise.all(BINARIES.map(async (bin) => [bin, Boolean(await commandExists(bin))] as const));
  return Object.fromEntries(entries) as Record<(typeof BINARIES)[number], boolean>;
}

export async function scanGgufDirectories(directories: string[]): Promise<LocalModel[]> {
  const models: LocalModel[] = [];
  for (const dir of directories) {
    let entries: string[] = [];
    try {
      entries = await readdir(dir);
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.toLowerCase().endsWith(".gguf")) continue;
      const full = path.join(dir, entry);
      try {
        const info = await stat(full);
        if (!info.isFile()) continue;
        models.push({
          id: entry.replace(/\.gguf$/i, ""),
          name: entry,
          source: "gguf",
          sizeBytes: info.size,
          artifactPath: full,
        });
      } catch {
        continue;
      }
    }
  }
  return models;
}

export const llamaCppAdapter: ModelRuntime = {
  id: "llamacpp",
  label: "llama.cpp",
  async detect() {
    const found = await detectLlamaCpp();
    return found["llama-cli"] || found["llama-server"] || found["llama-bench"];
  },
  async version() {
    return undefined;
  },
  async listModels() {
    return [];
  },
  async resolveModel(id: string) {
    if (!id.endsWith(".gguf")) return undefined;
    return { id, path: id, format: "gguf" } satisfies ModelArtifact;
  },
  async benchmarkCapabilities() {
    const found = await detectLlamaCpp();
    return found["llama-bench"] ? ["llama-bench"] : ["none"];
  },
};
