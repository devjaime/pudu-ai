import { describe, expect, it } from "vitest";
import { formatBytes, parseSizeToBytes } from "../src/shared/bytes.js";
import { computeLocalMeterScore } from "../src/benchmark/score.js";
import { localCompatibility } from "../src/compatibility/local.js";
import { parseArgs } from "../src/cli/parse-args.js";
import { benchmarkRecordSchema } from "../src/storage/benchmarks.js";

describe("bytes", () => {
  it("parses sizes", () => {
    expect(parseSizeToBytes("5.2 GB")).toBe(5.2 * 1000 ** 3);
    expect(formatBytes(16 * 1024 ** 3, 0)).toBe("16 GB");
  });
});

describe("scoring", () => {
  it("scores measured speed without inventing power", () => {
    const score = computeLocalMeterScore(42.8, { samples: 3, peakMemoryGb: 9.7, peakSwapGb: 0, avgCpuPercent: 70 }, 16);
    expect(score.total).toBeGreaterThan(50);
    expect(score.dimensions.find((d) => d.key === "energy")?.measured).toBe(false);
    expect(score.dimensions.find((d) => d.key === "speed")?.grade).toBe("A");
  });
});

describe("local compatibility", () => {
  it("grades by ram ratio as estimated", () => {
    const result = localCompatibility(
      {
        os: "macos",
        arch: "arm64",
        cpu: { appleSilicon: { generation: "M4", variant: "base" } },
        gpu: {},
        memory: { totalBytes: 16 * 1024 ** 3, unified: true },
      },
      { id: "qwen3-8b", name: "Qwen 3 8B", paramsBillions: 8 },
    );
    expect(result.source).toBe("estimated");
    expect(["S", "A", "B", "C", "D", "F"]).toContain(result.grade);
  });
});

describe("cli parse", () => {
  it("parses benchmark json flags", () => {
    const args = parseArgs(["node", "cli", "benchmark", "qwen3:8b", "--json", "--preset", "quick", "--no-network"]);
    expect(args.command).toBe("benchmark");
    expect(args.positional[0]).toBe("qwen3:8b");
    expect(args.json).toBe(true);
    expect(args.network).toBe(false);
    expect(args.preset).toBe("quick");
  });

  it("parses --lang", () => {
    const args = parseArgs(["node", "cli", "doctor", "--lang", "es"]);
    expect(args.command).toBe("doctor");
    expect(args.lang).toBe("es");
  });
});

describe("benchmark schema", () => {
  it("round-trips a record", () => {
    const record = benchmarkRecordSchema.parse({
      schemaVersion: 1,
      timestamp: "2026-09-06T00:00:00.000Z",
      machine: { cpu: "Apple M4" },
      model: { id: "qwen3:8b" },
      runtime: { name: "llama-bench" },
      benchmark: { promptTokens: 512, generationTokens: 128, repetitions: 3, generationTokensPerSecond: 42.8 },
      resources: { peakMemoryGb: 9.7 },
      origin: "measured",
    });
    expect(record.benchmark.generationTokensPerSecond).toBe(42.8);
  });
});
