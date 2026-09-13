import { describe, expect, it } from "vitest";
import { mergeOpenCodeHarness } from "../src/integrations/opencode-config.js";

describe("mergeOpenCodeHarness", () => {
  it("sets ollama model and pudu MCP without dropping existing mcp", () => {
    const merged = mergeOpenCodeHarness(
      {
        mcp: { other: { type: "remote", url: "https://example.com" } },
        model: "github-copilot/gpt",
      },
      "qwen3:8b",
      "python3",
      "/tmp/python",
    );
    expect(merged.model).toBe("ollama/qwen3:8b");
    const mcp = merged.mcp as Record<string, { type?: string; command?: string[] }>;
    expect(mcp.other?.type).toBe("remote");
    expect(mcp["pudu-ai"]?.type).toBe("local");
    expect(mcp["pudu-ai"]?.command).toEqual(["python3", "-m", "pudu_agent", "mcp"]);
    const provider = merged.provider as { ollama: { models: Record<string, { name: string }> } };
    expect(provider.ollama.models["qwen3:8b"]?.name).toBe("qwen3:8b");
  });
});
