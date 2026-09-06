import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseOllamaList, parseOllamaModelfile } from "../src/adapters/ollama/parse.js";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");

describe("ollama parsers", () => {
  it("parses ollama list", () => {
    const text = readFileSync(path.join(dir, "ollama-list.txt"), "utf8");
    const models = parseOllamaList(text);
    expect(models).toHaveLength(2);
    expect(models[0]?.id).toBe("qwen3:8b");
    expect(models[0]?.sizeBytes).toBeGreaterThan(5_000_000_000);
    expect(models[1]?.id).toBe("qwen3.5:4b");
  });

  it("parses modelfile FROM blob", () => {
    const text = readFileSync(path.join(dir, "ollama-modelfile.txt"), "utf8");
    const parsed = parseOllamaModelfile(text);
    expect(parsed.from).toContain("sha256-");
  });
});
