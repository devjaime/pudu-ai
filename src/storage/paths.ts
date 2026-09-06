import os from "node:os";
import path from "node:path";
import { mkdir } from "node:fs/promises";

export function homeDir(): string {
  return path.join(os.homedir(), ".localmeter");
}

export function configPath(): string {
  return path.join(homeDir(), "config.json");
}

export function modelsPath(): string {
  return path.join(homeDir(), "models.json");
}

export function benchmarksDir(): string {
  return path.join(homeDir(), "benchmarks");
}

export function telemetryDir(): string {
  return path.join(homeDir(), "telemetry");
}

export function cacheDir(): string {
  return path.join(homeDir(), "cache");
}

export function canirunCachePath(): string {
  return path.join(cacheDir(), "canirun-models.json");
}

export async function ensureStorage(): Promise<void> {
  await mkdir(benchmarksDir(), { recursive: true });
  await mkdir(telemetryDir(), { recursive: true });
  await mkdir(cacheDir(), { recursive: true });
}
