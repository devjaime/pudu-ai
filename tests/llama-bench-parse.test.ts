import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  parseLlamaBenchJson,
  parseLlamaBenchMarkdown,
  parseLlamaBenchOutput,
  tokensPerSecondPerWatt,
} from "../src/benchmark/parse-llama-bench.js";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");

describe("llama-bench parsers", () => {
  it("parses json output", () => {
    const text = readFileSync(path.join(dir, "llama-bench.json"), "utf8");
    const metrics = parseLlamaBenchJson(text);
    expect(metrics.promptTokensPerSecond).toBe(824.7);
    expect(metrics.generationTokensPerSecond).toBe(42.8);
  });

  it("parses markdown output", () => {
    const text = readFileSync(path.join(dir, "llama-bench.md"), "utf8");
    const metrics = parseLlamaBenchMarkdown(text);
    expect(metrics.promptTokensPerSecond).toBe(824.7);
    expect(metrics.generationTokensPerSecond).toBe(42.8);
  });

  it("extracts json from noisy stdout", () => {
    const json = readFileSync(path.join(dir, "llama-bench.json"), "utf8");
    const metrics = parseLlamaBenchOutput(`ggml_metal_device_init: GPU name\n${json}`);
    expect(metrics.generationTokensPerSecond).toBe(42.8);
  });

  it("computes tokens/s/W", () => {
    expect(tokensPerSecondPerWatt(42.8, 22.1)).toBe(1.94);
    expect(tokensPerSecondPerWatt(42.8, 0)).toBeUndefined();
  });
});
