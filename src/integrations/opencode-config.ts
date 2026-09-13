import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { pythonRoot } from "../agent-lab/python-bridge.js";

export type OpenCodeHarnessConfig = {
  repo: string;
  ollamaTag: string;
  pythonBin: string;
};

export function mergeOpenCodeHarness(
  existing: Record<string, unknown> | undefined,
  ollamaTag: string,
  pythonBin: string,
  engineRoot: string,
): Record<string, unknown> {
  const prev = existing ?? {};
  const provider = (prev.provider as Record<string, unknown> | undefined) ?? {};
  const ollama = (provider.ollama as Record<string, unknown> | undefined) ?? {};
  const models = (ollama.models as Record<string, unknown> | undefined) ?? {};
  const mcp = (prev.mcp as Record<string, unknown> | undefined) ?? {};
  return {
    ...prev,
    $schema: typeof prev.$schema === "string" ? prev.$schema : "https://opencode.ai/config.json",
    model: `ollama/${ollamaTag}`,
    provider: {
      ...provider,
      ollama: {
        ...ollama,
        npm: "@ai-sdk/openai-compatible",
        name: typeof ollama.name === "string" ? ollama.name : "Ollama (local)",
        options: {
          ...((ollama.options as Record<string, unknown> | undefined) ?? {}),
          baseURL: "http://127.0.0.1:11434/v1",
        },
        models: {
          ...models,
          [ollamaTag]: {
            ...((models[ollamaTag] as Record<string, unknown> | undefined) ?? {}),
            name: ollamaTag,
          },
        },
      },
    },
    mcp: {
      ...mcp,
      "pudu-ai": {
        type: "local",
        enabled: true,
        timeout: 120000,
        command: [pythonBin, "-m", "pudu_agent", "mcp"],
        environment: { PYTHONPATH: engineRoot, PYTHONUNBUFFERED: "1" },
      },
    },
  };
}

export async function writeOpenCodeHarnessConfig(input: OpenCodeHarnessConfig): Promise<string> {
  const file = path.join(input.repo, "opencode.json");
  let existing: Record<string, unknown> | undefined;
  try {
    const raw = await readFile(file, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      existing = parsed as Record<string, unknown>;
    }
  } catch {
    existing = undefined;
  }
  const next = mergeOpenCodeHarness(existing, input.ollamaTag, input.pythonBin, pythonRoot());
  await mkdir(input.repo, { recursive: true });
  await writeFile(file, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return file;
}
