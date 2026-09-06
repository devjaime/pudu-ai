import { readFile, writeFile } from "node:fs/promises";
import { z } from "zod";
import { configPath, ensureStorage } from "./paths.js";

export const configSchema = z.object({
  schemaVersion: z.literal(1),
  modelPaths: z.array(z.string()).default([]),
  network: z.boolean().default(true),
});

export type AppConfig = z.infer<typeof configSchema>;

const fallback: AppConfig = { schemaVersion: 1, modelPaths: [], network: true };

export async function loadConfig(): Promise<AppConfig> {
  await ensureStorage();
  try {
    const raw = await readFile(configPath(), "utf8");
    return configSchema.parse(JSON.parse(raw));
  } catch {
    await saveConfig(fallback);
    return fallback;
  }
}

export async function saveConfig(config: AppConfig): Promise<void> {
  await ensureStorage();
  await writeFile(configPath(), `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

export async function addModelPath(dir: string): Promise<AppConfig> {
  const config = await loadConfig();
  if (!config.modelPaths.includes(dir)) config.modelPaths.push(dir);
  await saveConfig(config);
  return config;
}
