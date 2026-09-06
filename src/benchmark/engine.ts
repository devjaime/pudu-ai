import { spawnTracked, toText } from "../shared/process.js";
import { commandExists } from "../shared/which.js";
import { bytesToGiB } from "../shared/bytes.js";
import type { HardwareProfile } from "../hardware/types.js";
import type { LocalModel } from "../models/types.js";
import { saveBenchmark, type BenchmarkRecord } from "../storage/benchmarks.js";
import { TelemetryCollector, type ResourceSummary } from "../telemetry/collector.js";
import type { SystemSample } from "../telemetry/types.js";
import { parseLlamaBenchOutput, tokensPerSecondPerWatt } from "./parse-llama-bench.js";
import { resolvePreset, type BenchmarkPreset } from "./presets.js";
import { computeLocalMeterScore } from "./score.js";
import { assessRun } from "./assess.js";
import type { CatalogModel } from "../compatibility/types.js";

export type BenchmarkProgress = {
  sample?: SystemSample;
  elapsedSeconds: number;
  status: "running" | "completed" | "failed" | "cancelled";
};

export type BenchmarkResult = {
  record: BenchmarkRecord;
  assessment: string[];
  path: string;
  stdout: string;
};

export async function runBenchmark(input: {
  model: LocalModel;
  hardware: HardwareProfile;
  preset?: string;
  catalog?: CatalogModel;
  signal?: AbortSignal;
  onProgress?: (progress: BenchmarkProgress) => void;
}): Promise<BenchmarkResult> {
  const bench = await commandExists("llama-bench");
  if (!bench) {
    throw new Error("llama-bench not found. Install llama.cpp (e.g. brew install llama.cpp).");
  }
  const artifact = input.model.artifactPath;
  if (!artifact) {
    throw new Error(`No GGUF path for ${input.model.id}. Cannot run llama-bench.`);
  }

  const preset: BenchmarkPreset = resolvePreset(input.preset);
  const started = Date.now();
  const args = [
    "-m",
    artifact,
    "-p",
    String(preset.promptTokens),
    "-n",
    String(preset.generationTokens),
    "-r",
    String(preset.repetitions),
    "-o",
    "json",
  ];

  const subprocess = spawnTracked(bench, args, { timeout: 30 * 60_000 });
  const collector = new TelemetryCollector(subprocess.pid);
  collector.onSample = (sample) => {
    input.onProgress?.({ sample, elapsedSeconds: (Date.now() - started) / 1000, status: "running" });
  };
  await collector.start(750);
  const abort = (): void => {
    subprocess.kill("SIGTERM");
  };
  input.signal?.addEventListener("abort", abort, { once: true });

  const result = await subprocess;
  input.signal?.removeEventListener("abort", abort);
  const resources = await collector.stop();

  if (input.signal?.aborted) {
    throw new Error("Benchmark cancelled");
  }
  const stdout = toText(result.stdout);
  const stderr = toText(result.stderr);
  if (result.exitCode !== 0) {
    throw new Error(stderr || `llama-bench exited with ${result.exitCode}`);
  }

  const metrics = parseLlamaBenchOutput(stdout || stderr);
  const score = computeLocalMeterScore(
    metrics.generationTokensPerSecond,
    resources,
    bytesToGiB(input.hardware.memory.totalBytes),
  );
  const efficiency = tokensPerSecondPerWatt(
    metrics.generationTokensPerSecond,
    resources.avgPackagePowerWatts,
  );

  const record: BenchmarkRecord = {
    schemaVersion: 1,
    timestamp: new Date().toISOString(),
    machine: {
      os: input.hardware.os,
      arch: input.hardware.arch,
      model: input.hardware.machineModel,
      cpu: input.hardware.cpu.name,
      memoryGb: Number(bytesToGiB(input.hardware.memory.totalBytes).toFixed(1)),
      unified: input.hardware.memory.unified,
    },
    model: {
      id: input.model.id,
      name: input.model.name,
      source: input.model.source,
      path: input.model.artifactPath,
    },
    runtime: { name: "llama-bench", command: [bench, ...args] },
    benchmark: {
      promptTokens: preset.promptTokens,
      generationTokens: preset.generationTokens,
      repetitions: preset.repetitions,
      promptTokensPerSecond: metrics.promptTokensPerSecond,
      generationTokensPerSecond: metrics.generationTokensPerSecond,
      elapsedSeconds: (Date.now() - started) / 1000,
    },
    resources: {
      ...resourceFields(resources),
      tokensPerSecondPerWatt: efficiency,
    },
    score: {
      total: score.total ?? 0,
      speed: score.dimensions.find((d) => d.key === "speed")?.grade,
      memory: score.dimensions.find((d) => d.key === "memory")?.grade,
      energy: score.dimensions.find((d) => d.key === "energy")?.grade,
      thermal: score.dimensions.find((d) => d.key === "thermal")?.grade,
      swap: score.dimensions.find((d) => d.key === "swap")?.grade,
    },
    origin: "measured",
  };

  const path = await saveBenchmark(record);
  input.onProgress?.({
    elapsedSeconds: record.benchmark.elapsedSeconds ?? 0,
    status: "completed",
  });

  return {
    record,
    assessment: assessRun({
      generationTokensPerSecond: metrics.generationTokensPerSecond,
      resources,
      catalog: input.catalog,
    }),
    path,
    stdout,
  };
}

function resourceFields(resources: ResourceSummary): BenchmarkRecord["resources"] {
  return {
    peakMemoryGb: resources.peakMemoryGb,
    peakSwapGb: resources.peakSwapGb,
    avgGpuPercent: resources.avgGpuPercent,
    avgCpuPercent: resources.avgCpuPercent,
    peakGpuPercent: resources.peakGpuPercent,
    avgPackagePowerWatts: resources.avgPackagePowerWatts,
    peakPackagePowerWatts: resources.peakPackagePowerWatts,
    avgTemperatureC: resources.avgTemperatureC,
    peakTemperatureC: resources.peakTemperatureC,
    peakProcessRssGb: resources.peakProcessRssGb,
  };
}
