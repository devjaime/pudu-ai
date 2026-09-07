import { describe, expect, it } from "vitest";
import { setLocale } from "../src/i18n/index.js";
import { decideLaunch, toOllamaTag } from "../src/integrations/decide.js";
import type { Session } from "../src/session/load.js";

function session(grade: "S" | "A" | "C" | "F", tps?: number): Session {
  return {
    hardware: {
      os: "macos",
      arch: "arm64",
      cpu: {},
      gpu: {},
      memory: { totalBytes: 16 * 1024 ** 3, unified: true },
    },
    runtimes: [{ id: "ollama", label: "Ollama", detected: true }],
    models: [{ id: "qwen3:8b", name: "qwen3:8b", source: "ollama" }],
    catalog: [],
    rows: [
      {
        local: { id: "qwen3:8b", name: "qwen3:8b", source: "ollama" },
        catalog: { id: "qwen3-8b", name: "Qwen 3 8B", useCase: ["chat", "code"] },
        compatibility: { modelId: "qwen3-8b", source: "estimated", grade },
        lastBenchmark:
          tps === undefined
            ? undefined
            : {
                schemaVersion: 1,
                timestamp: "2026-01-01T00:00:00.000Z",
                machine: {},
                model: { id: "qwen3:8b" },
                runtime: { name: "llama-bench" },
                benchmark: {
                  promptTokens: 512,
                  generationTokens: 128,
                  repetitions: 3,
                  generationTokensPerSecond: tps,
                },
                resources: {},
                origin: "measured",
              },
      },
    ],
    recommendations: [],
    history: [],
    llamaBench: true,
    networkUsed: false,
    agents: [],
  };
}

describe("ollama launch gate", () => {
  it("maps catalog ids to ollama tags", () => {
    expect(toOllamaTag("qwen3-8b")).toBe("qwen3:8b");
    expect(toOllamaTag("qwen3:8b")).toBe("qwen3:8b");
  });

  it("allows OpenCode when grade is A", () => {
    setLocale("en");
    const decision = decideLaunch(session("A"), "opencode");
    expect(decision.eligible).toBe(true);
    expect(decision.command).toContain("ollama launch opencode --model qwen3:8b");
  });

  it("blocks OpenCode when grade is C", () => {
    const decision = decideLaunch(session("C"), "opencode");
    expect(decision.eligible).toBe(false);
  });

  it("blocks when measured speed is too low", () => {
    const decision = decideLaunch(session("S", 4), "opencode");
    expect(decision.eligible).toBe(false);
  });
});
