import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { commandExists } from "../src/shared/which.js";
import { findPython, invokePuduAgent, parseJsonStdout, pythonRoot } from "../src/agent-lab/python-bridge.js";
import { classifySearch, searchRepo } from "../src/agent-lab/search.js";
import { parseSearchResult } from "../src/agent-lab/schema.js";
import { formatSearchText } from "../src/agent-lab/repo-cli.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const smallRepo = path.join(root, "tests/fixtures/repos/python-small");
const crossRepo = path.join(root, "tests/fixtures/repos/python-cross-module");

async function pythonReady(): Promise<boolean> {
  return Boolean(await findPython());
}

describe("Agent Lab protocol", () => {
  it("python root is the shipped package", () => {
    expect(pythonRoot().endsWith(`${path.sep}python`)).toBe(true);
  });

  it("pings the Python engine", async () => {
    if (!(await pythonReady())) return;
    const invoked = await invokePuduAgent({ op: "ping" });
    const parsed = parseJsonStdout(invoked.stdout) as { ok: boolean; op: string };
    expect(parsed.ok).toBe(true);
    expect(parsed.op).toBe("ping");
  });

  it("classifies search intents without an LLM", async () => {
    if (!(await pythonReady())) return;
    await expect(classifySearch({ query: "validate_user" })).resolves.toMatchObject({
      intent: "TEXT",
      strategies: ["rg"],
    });
    await expect(classifySearch({ structuralPattern: "def $FUNC($$$ARGS): $$$BODY" })).resolves.toMatchObject({
      intent: "STRUCTURAL",
      strategies: ["ast-grep"],
    });
    await expect(classifySearch({ query: "who calls validate_user" })).resolves.toMatchObject({
      intent: "RELATIONSHIP",
      strategies: ["graph"],
    });
    await expect(classifySearch({ query: "impact of validate_user" })).resolves.toMatchObject({
      intent: "IMPACT",
    });
    await expect(classifySearch({ query: "validate_user", intent: "UNKNOWN" })).resolves.toMatchObject({
      intent: "UNKNOWN",
      strategies: ["rg", "ast-grep"],
    });
  });

  it("parses rg JSON lines without running rg", async () => {
    if (!(await pythonReady())) return;
    const line = readFileSync(path.join(root, "tests/fixtures/rg-match.jsonl"), "utf8")
      .split("\n")
      .find((row) => row.includes('"type":"match"'));
    const python = (await findPython())!;
    const { runCommand } = await import("../src/shared/process.js");
    const result = await runCommand(python, ["-c", "from pudu_agent.search import parse_rg_json_line; import sys, json; print(json.dumps(parse_rg_json_line(sys.stdin.read())))"], {
      cwd: pythonRoot(),
      env: { ...process.env, PYTHONPATH: pythonRoot() },
      input: line,
    });
    const parsed = JSON.parse(result.stdout) as { file: string; line: number; strategy: string };
    expect(parsed.file).toBe("auth.py");
    expect(parsed.line).toBe(1);
    expect(parsed.strategy).toBe("rg");
  });

  it("parses ast-grep JSON without running ast-grep", async () => {
    if (!(await pythonReady())) return;
    const payload = readFileSync(path.join(root, "tests/fixtures/ast-grep-match.json"), "utf8");
    const python = (await findPython())!;
    const { runCommand } = await import("../src/shared/process.js");
    const result = await runCommand(
      python,
      [
        "-c",
        "from pudu_agent.ast_search import parse_ast_grep_stdout; import sys, json; print(json.dumps(parse_ast_grep_stdout(sys.stdin.read())))",
      ],
      {
        cwd: pythonRoot(),
        env: { ...process.env, PYTHONPATH: pythonRoot() },
        input: payload,
      },
    );
    const parsed = JSON.parse(result.stdout) as Array<{ file: string; metavariables: Record<string, string> }>;
    expect(parsed[0]?.file).toBe("pkg/auth.py");
    expect(parsed[0]?.metavariables.FUNC).toBe("validate_user");
  });
});

describe("Agent Lab repo search", () => {
  it("text-searches the small fixture with rg", async () => {
    if (!(await pythonReady()) || !(await commandExists("rg"))) return;
    const result = await searchRepo({ repo: smallRepo, query: "validate_user", intent: "TEXT" });
    expect(result.schemaVersion).toBe(1);
    expect(result.ok).toBe(true);
    expect(result.intent).toBe("TEXT");
    expect(result.strategy).toBe("rg");
    expect(result.metrics.origin).toBe("MEASURED");
    expect(result.matches.some((m) => m.file.includes("auth.py") && m.text.includes("validate_user"))).toBe(true);
    expect(result.matches.some((m) => m.file.includes("config.yaml"))).toBe(false);
    parseSearchResult(result);
  });

  it("finds config literals that are not function shapes", async () => {
    if (!(await pythonReady()) || !(await commandExists("rg"))) return;
    const result = await searchRepo({ repo: smallRepo, query: "invalid user token", intent: "TEXT" });
    expect(result.matches.some((m) => m.file.includes("config.yaml"))).toBe(true);
  });

  it("structural-searches Python defs with ast-grep", async () => {
    if (!(await pythonReady()) || !(await commandExists("ast-grep") || (await commandExists("sg")))) return;
    const result = await searchRepo({
      repo: crossRepo,
      structuralPattern: "def $FUNC($$$ARGS): $$$BODY",
      intent: "STRUCTURAL",
    });
    expect(result.strategy).toBe("ast-grep");
    expect(result.matches.some((m) => m.strategy === "ast-grep" && m.text.includes("validate_user"))).toBe(true);
  });

  it("does not invent graph results", async () => {
    if (!(await pythonReady())) return;
    const result = await searchRepo({ repo: smallRepo, query: "who calls validate_user" });
    expect(result.strategy).toBe("graph");
    expect(result.matches).toEqual([]);
    expect(result.errors.some((e) => e.tool === "graph")).toBe(true);
    expect(result.unavailable).toContain("graph");
  });

  it("formats text output with origin labels", () => {
    const text = formatSearchText({
      schemaVersion: 1,
      ok: true,
      op: "search",
      repo: smallRepo,
      query: "x",
      structuralPattern: null,
      intent: "TEXT",
      strategy: "rg",
      matches: [],
      tools: {
        rg: { available: false, path: null, version: null },
        astGrep: { available: false, path: null, version: null },
        graph: { available: false, path: null, version: null },
      },
      errors: [],
      metrics: {
        durationMs: 1,
        matchCount: 0,
        rgQueries: 0,
        astQueries: 0,
        graphQueries: 0,
        origin: "MEASURED",
      },
      unavailable: ["rg"],
    });
    expect(text).toContain("MEASURED");
    expect(text).toContain("No matches");
  });
});


