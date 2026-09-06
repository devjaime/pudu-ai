import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { benchmarksDir, ensureStorage } from "./paths.js";

export const benchmarkRecordSchema = z.object({
  schemaVersion: z.literal(1),
  timestamp: z.string(),
  machine: z.record(z.unknown()),
  model: z.object({
    id: z.string(),
    name: z.string().optional(),
    source: z.string().optional(),
    path: z.string().optional(),
  }),
  runtime: z.object({
    name: z.string(),
    command: z.array(z.string()).optional(),
  }),
  benchmark: z.object({
    promptTokens: z.number(),
    generationTokens: z.number(),
    repetitions: z.number(),
    promptTokensPerSecond: z.number().optional(),
    generationTokensPerSecond: z.number().optional(),
    elapsedSeconds: z.number().optional(),
  }),
  resources: z.object({
    peakMemoryGb: z.number().optional(),
    peakSwapGb: z.number().optional(),
    avgGpuPercent: z.number().optional(),
    avgCpuPercent: z.number().optional(),
    peakGpuPercent: z.number().optional(),
    avgPackagePowerWatts: z.number().optional(),
    peakPackagePowerWatts: z.number().optional(),
    avgTemperatureC: z.number().optional(),
    peakTemperatureC: z.number().optional(),
    tokensPerSecondPerWatt: z.number().optional(),
    peakProcessRssGb: z.number().optional(),
  }),
  score: z
    .object({
      total: z.number(),
      speed: z.string().optional(),
      memory: z.string().optional(),
      energy: z.string().optional(),
      thermal: z.string().optional(),
      swap: z.string().optional(),
    })
    .optional(),
  origin: z.enum(["measured"]).default("measured"),
});

export type BenchmarkRecord = z.infer<typeof benchmarkRecordSchema>;

export async function saveBenchmark(record: BenchmarkRecord): Promise<string> {
  await ensureStorage();
  const safeName = record.model.id.replace(/[^a-zA-Z0-9._-]+/g, "-");
  const file = path.join(benchmarksDir(), `${record.timestamp.replace(/[:.]/g, "-")}-${safeName}.json`);
  await writeFile(file, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  return file;
}

export async function listBenchmarks(): Promise<BenchmarkRecord[]> {
  await ensureStorage();
  let files: string[] = [];
  try {
    files = (await readdir(benchmarksDir())).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }
  const records: BenchmarkRecord[] = [];
  for (const file of files.sort()) {
    try {
      const raw = await readFile(path.join(benchmarksDir(), file), "utf8");
      records.push(benchmarkRecordSchema.parse(JSON.parse(raw)));
    } catch {
      continue;
    }
  }
  return records;
}
