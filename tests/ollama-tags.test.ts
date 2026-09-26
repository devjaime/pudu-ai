import { describe, expect, it } from "vitest";
import { classifyOllamaTag, resolveOllamaTag } from "../src/integrations/ollama-tags.js";

describe("resolveOllamaTag", () => {
  it("maps known catalog names to Ollama library tags", () => {
    expect(resolveOllamaTag("qwen3-8b")).toBe("qwen3:8b");
    expect(resolveOllamaTag("Qwen 3 8B")).toBe("qwen3:8b");
    expect(resolveOllamaTag("qwen3.5:4b")).toBe("qwen3.5:4b");
    expect(resolveOllamaTag("gemma3-4b", "Gemma 3 4B")).toBe("gemma3:4b");
    expect(resolveOllamaTag("gemma4:e2b")).toBe("gemma4:e2b");
    expect(resolveOllamaTag("Gemma 4 E4B")).toBe("gemma4:e4b");
    expect(resolveOllamaTag("gemma4:e2b-mlx")).toBe("gemma4:e2b-mlx");
  });

  it("classifies cloud tags and leaves unknown catalog names unresolved", () => {
    expect(classifyOllamaTag("gemma4:cloud")).toBe("cloud");
    expect(classifyOllamaTag("gemma4:31b-cloud")).toBe("cloud");
    expect(resolveOllamaTag("gemma4:cloud")).toBeUndefined();
    expect(classifyOllamaTag("Agents-A1")).toBe("unknown");
    expect(resolveOllamaTag("Agents-A1")).toBeUndefined();
    expect(classifyOllamaTag("gemma3:4b")).toBe("local");
  });

  it("refuses unknown catalog models that are not in the Ollama library", () => {
    expect(resolveOllamaTag("agents-a1", "Agents-A1 35B-A3B")).toBeUndefined();
    expect(resolveOllamaTag("lfm2-24b")).toBeUndefined();
  });
});
