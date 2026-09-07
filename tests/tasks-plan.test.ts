import { describe, expect, it } from "vitest";
import { setLocale } from "../src/i18n/index.js";
import { parseAnswers, parseKinds, planTasks } from "../src/tasks/plan.js";
import type { Session } from "../src/session/load.js";

function session(): Session {
  return {
    hardware: {
      os: "macos",
      arch: "arm64",
      cpu: { appleSilicon: { generation: "M4", variant: "base" } },
      gpu: {},
      memory: { totalBytes: 16 * 1024 ** 3, unified: true },
    },
    runtimes: [],
    models: [{ id: "qwen3:8b", name: "qwen3:8b", source: "ollama" }],
    catalog: [
      { id: "qwen3-8b", name: "Qwen 3 8B", paramsBillions: 8, useCase: ["chat", "code", "reasoning"] },
      { id: "wan2.1-t2v-1.3b", name: "Wan 2.1 T2V 1.3B", paramsBillions: 1.3, useCase: ["video"] },
    ],
    rows: [
      {
        local: { id: "qwen3:8b", name: "qwen3:8b", source: "ollama" },
        catalog: { id: "qwen3-8b", name: "Qwen 3 8B", paramsBillions: 8, useCase: ["chat", "code", "reasoning"] },
        compatibility: { modelId: "qwen3-8b", source: "estimated", grade: "A" },
      },
    ],
    recommendations: [],
    history: [],
    llamaBench: true,
    networkUsed: false,
    agents: [],
  };
}

describe("task harness planner", () => {
  it("parses kinds", () => {
    expect(parseKinds("code,image")).toEqual(["code", "image"]);
  });

  it("recommends code harnesses for installed qwen", () => {
    setLocale("en");
    const answers = parseAnswers({ for: "code,chat", scope: "installed" });
    const plans = planTasks(session(), answers);
    expect(plans[0]?.installed).toBe(true);
    expect(plans[0]?.tasks.some((task) => task.kind === "code")).toBe(true);
    expect(plans[0]?.tasks[0]?.prompt.length).toBeGreaterThan(20);
  });

  it("can include estimated video models from catalog", () => {
    setLocale("es");
    const answers = parseAnswers({ for: "video", scope: "all" });
    const plans = planTasks(session(), answers);
    expect(plans.some((p) => p.modelId.includes("wan") && !p.installed)).toBe(true);
    expect(plans[0]?.origin).toBe("estimated");
    setLocale("en");
  });
});
