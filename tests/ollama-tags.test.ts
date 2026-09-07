import { describe, expect, it } from "vitest";
import { resolveOllamaTag } from "../src/integrations/ollama-tags.js";

describe("resolveOllamaTag", () => {
  it("maps known catalog names to Ollama library tags", () => {
    expect(resolveOllamaTag("qwen3-8b")).toBe("qwen3:8b");
    expect(resolveOllamaTag("Qwen 3 8B")).toBe("qwen3:8b");
    expect(resolveOllamaTag("qwen3.5:4b")).toBe("qwen3.5:4b");
    expect(resolveOllamaTag("gemma3-4b", "Gemma 3 4B")).toBe("gemma3:4b");
  });

  it("refuses unknown catalog models that are not in the Ollama library", () => {
    expect(resolveOllamaTag("agents-a1", "Agents-A1 35B-A3B")).toBeUndefined();
    expect(resolveOllamaTag("lfm2-24b")).toBeUndefined();
  });
});
