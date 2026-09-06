import { runCommand } from "../../shared/process.js";
import { commandExists } from "../../shared/which.js";
import type { ModelRuntime } from "../../runtimes/types.js";
import type { LocalModel, ModelArtifact } from "../../models/types.js";
import { parseOllamaList, parseOllamaModelfile } from "./parse.js";

export const ollamaAdapter: ModelRuntime = {
  id: "ollama",
  label: "Ollama",
  async detect() {
    return Boolean(await commandExists("ollama"));
  },
  async version() {
    const result = await runCommand("ollama", ["--version"], { timeout: 8000 });
    const text = `${result.stdout} ${result.stderr}`;
    const match = text.match(/(\d+\.\d+\.\d+)/);
    return match?.[1];
  },
  async listModels() {
    if (!(await this.detect())) return [];
    const result = await runCommand("ollama", ["list"], { timeout: 15000 });
    const models = parseOllamaList(result.stdout);
    const resolved = await Promise.all(
      models.map(async (model) => {
        const artifact = await resolveOllamaBlob(model.id);
        return { ...model, artifactPath: artifact?.path };
      }),
    );
    return resolved;
  },
  async resolveModel(id: string) {
    return resolveOllamaBlob(id);
  },
  async benchmarkCapabilities() {
    return ["llama-bench"];
  },
};

async function resolveOllamaBlob(id: string): Promise<ModelArtifact | undefined> {
  const result = await runCommand("ollama", ["show", "--modelfile", id], { timeout: 15000 });
  if (result.exitCode !== 0) return undefined;
  const { from } = parseOllamaModelfile(result.stdout);
  if (!from) return undefined;
  const format = from.endsWith(".gguf") || from.includes("sha256-") ? "gguf" : "unknown";
  return { id, path: from, format };
}

export async function listOllamaModels(): Promise<LocalModel[]> {
  return ollamaAdapter.listModels();
}
