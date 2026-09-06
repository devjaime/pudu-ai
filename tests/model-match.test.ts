import { describe, expect, it } from "vitest";
import { idsLikelyMatch, normalizeModelId } from "../src/models/match.js";

describe("model id matching", () => {
  it("matches ollama tags to catalog ids", () => {
    expect(normalizeModelId("qwen3:8b")).toBe("qwen3-8b");
    expect(idsLikelyMatch("qwen3:8b", "qwen3-8b")).toBe(true);
    expect(idsLikelyMatch("qwen3.5:4b", "qwen3.5-4b")).toBe(true);
  });
});
