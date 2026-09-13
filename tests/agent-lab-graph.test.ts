import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { findPython, invokePuduAgent, parseJsonStdout } from "../src/agent-lab/python-bridge.js";
import { parseArgs } from "../src/cli/parse-args.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const smallRepo = path.join(root, "tests/fixtures/repos/python-small");

describe("repo graph CLI args", () => {
  it("parses graph and harness --task", () => {
    const graph = parseArgs(["node", "pudu-ai", "repo", "graph", "--repo", ".", "--json"]);
    expect(graph.command).toBe("repo");
    expect(graph.positional).toEqual(["graph"]);
    expect(graph.repo).toBe(".");
    const harness = parseArgs(["node", "pudu-ai", "repo", "harness", "--task", "fix auth", "--repo", "."]);
    expect(harness.positional).toEqual(["harness"]);
    expect(harness.task).toBe("fix auth");
  });
});

describe("Python local graph", () => {
  it("extracts defs and calls from the small fixture", async () => {
    if (!(await findPython())) return;
    const invoked = await invokePuduAgent({ op: "graph", repo: smallRepo }, 20_000);
    const graph = parseJsonStdout(invoked.stdout) as {
      ok: boolean;
      edges: Array<{ type: string; symbol: string | null; confidence: string }>;
      effort: { label: string; origin: string };
      metrics: { origin: string; fileCount: number };
    };
    expect(graph.ok).toBe(true);
    expect(graph.metrics.origin).toBe("MEASURED");
    expect(graph.effort.origin).toBe("DERIVED");
    expect(graph.metrics.fileCount).toBeGreaterThan(0);
    expect(graph.edges.some((e) => e.type === "definitions" && e.symbol === "validate_user")).toBe(true);
    expect(graph.edges.every((e) => e.confidence === "EXTRACTED" || e.confidence === "RESOLVED" || e.confidence === "INFERRED")).toBe(
      true,
    );
  });
});
