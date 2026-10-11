import { describe, expect, it, vi } from "vitest";
import { parseArgs } from "../src/cli/parse-args.js";
import { dispatchesTaskBeforeSession, runTaskCommand, validateTaskResponse } from "../src/cli/task-run.js";
import type { CliArgs } from "../src/cli/parse-args.js";

function args(argv: string[]): CliArgs {
  return parseArgs(["node", "pudu-ai", ...argv]);
}

describe("task command validation", () => {
  it("parses singular text tasks without changing the plural planner command", () => {
    expect(args(["task", "run", "--task", "summarize", "--repo", ".", "--model", "auto", "--kind", "summary", "--json"])).toMatchObject({
      command: "task", positional: ["run"], task: "summarize", repo: ".", model: "auto", kind: "summary", json: true,
    });
    expect(args(["tasks"]).command).toBe("tasks");
  });

  it.each([{ argv: ["task"] }, { argv: ["task", "typo"] }, { argv: ["task", "run", "extra"] }, { argv: ["task", "--help"] }])(
    "routes unsupported invocation $argv away from session discovery", ({ argv }) => {
    const parsed = args(argv);
    expect(parsed.command).toBe("task");
    expect(dispatchesTaskBeforeSession(parsed)).toBe(true);
  });

  it.each([{ argv: ["task"] }, { argv: ["task", "typo"] }, { argv: ["task", "run", "extra"] }, { argv: ["task", "--help"] }])(
    "returns structured usage failure for $argv", async ({ argv }) => {
    const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const code = await runTaskCommand({ ...args(argv), json: true });
    expect(code).not.toBe(0);
    const output = JSON.parse(write.mock.calls.map(([value]) => String(value)).join(""));
    expect(output).toMatchObject({ ok: false, status: "failed", op: "task", error: expect.stringContaining("Usage") });
    write.mockRestore();
  });

  it("rejects Python failure envelopes without a failed status", () => {
    expect(() => validateTaskResponse({ schemaVersion: 1, ok: false, op: "task", taskId: "id", error: "failed" })).toThrow(/status/);
    expect(validateTaskResponse({ schemaVersion: 1, ok: false, op: "task", taskId: "id", error: "failed", status: "failed" }).status).toBe("failed");
  });
});
