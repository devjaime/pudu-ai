import { describe, expect, it } from "vitest";
import { pickHarnessModel } from "../src/agent-lab/harness.js";
import type { Session } from "../src/session/load.js";

function session(rows: Session["rows"]): Session {
  return {
    hardware: {} as Session["hardware"],
    runtimes: [],
    models: rows.map((r) => r.local),
    catalog: [],
    rows,
    recommendations: [],
    history: [],
    llamaBench: false,
    networkUsed: false,
    agents: [],
  };
}

describe("pickHarnessModel", () => {
  it("returns N/A without invented models", () => {
    const pick = pickHarnessModel(session([]), { label: "LOW" });
    expect(pick.modelId).toBeNull();
    expect(pick.origin).toBeNull();
    expect(pick.reason).toContain("N/A");
  });

  it("prefers better grade for MEDIUM when there is no measured t/s", () => {
    const pick = pickHarnessModel(
      session([
        {
          local: { id: "tight", name: "tight", source: "ollama" },
          catalog: { id: "tight", name: "tight", useCase: ["code"] },
          compatibility: { modelId: "tight", source: "estimated", grade: "C" },
        },
        {
          local: { id: "best", name: "best", source: "ollama" },
          catalog: { id: "best", name: "best", useCase: ["code"] },
          compatibility: { modelId: "best", source: "estimated", grade: "A" },
        },
      ]),
      { label: "MEDIUM" },
    );
    expect(pick.modelId).toBe("best");
    expect(pick.origin).toBe("DERIVED");
  });
});
