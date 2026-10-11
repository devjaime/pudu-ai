import path from "node:path";
import { randomUUID } from "node:crypto";
import { stat } from "node:fs/promises";
import { invokePuduAgent, parseJsonStdout } from "../agent-lab/python-bridge.js";
import type { CliArgs } from "./parse-args.js";

const KINDS = new Set(["analysis", "summary", "code_review", "test_generation", "documentation"]);
type TaskRequest = {
  op: "task";
  taskId: string;
  task: string;
  kind: string;
  repo: string;
  model: string | null;
};

type TaskResponse = {
  schemaVersion: number;
  ok: boolean;
  op: "task";
  taskId: string;
  error?: string;
  status?: string;
  content?: string | null;
  model?: string | null;
  provenance?: Record<string, unknown>;
  metrics?: Record<string, number | null>;
  verification?: Record<string, unknown> | null;
};

export function validateTaskResponse(value: unknown): TaskResponse {
  if (!value || typeof value !== "object") throw new Error("Python task response must be an object");
  const data = value as Record<string, unknown>;
  if (data.schemaVersion !== 1 || typeof data.ok !== "boolean" || data.op !== "task" || typeof data.taskId !== "string") {
    throw new Error("Python task response has an unsupported contract");
  }
  if (data.provenance !== undefined && (!data.provenance || typeof data.provenance !== "object" || Array.isArray(data.provenance))) {
    throw new Error("Python task response has invalid provenance");
  }
  if (data.metrics !== undefined && (!data.metrics || typeof data.metrics !== "object" || Array.isArray(data.metrics) ||
      Object.values(data.metrics as Record<string, unknown>).some((value) => value !== null && typeof value !== "number"))) {
    throw new Error("Python task response has invalid metrics");
  }
  if (!data.ok && data.status !== "failed") {
    throw new Error("Python task failure response must have status failed");
  }
  if (data.ok && (typeof data.status !== "string" || !(typeof data.content === "string" || data.content === null))) {
    throw new Error("Python task response is missing result fields");
  }
  return data as TaskResponse;
}

function render(response: TaskResponse): string {
  if (!response.ok) return `Local task failed (${response.taskId}): ${response.error ?? "unknown error"}`;
  const metrics = response.metrics ?? {};
  return [
    `Local task ${response.status} (${response.taskId})`,
    `Model       ${response.model ?? "N/A"} (${String(response.provenance?.model ?? "UNKNOWN")})`,
    `Verification ${String(response.verification?.level ?? "N/A")}: ${String(response.verification?.status ?? "N/A")}`,
    `Tokens      ${metrics.total_tokens ?? "N/A"} (prompt ${metrics.prompt_tokens ?? "N/A"}, completion ${metrics.completion_tokens ?? "N/A"})`,
    "",
    response.content ?? "",
  ].join("\n");
}

export function dispatchesTaskBeforeSession(args: CliArgs): boolean {
  return args.command === "task";
}

export async function runTaskCommand(args: CliArgs): Promise<number> {
  const task = args.task?.trim();
  const repo = path.resolve(args.repo ?? process.cwd());
  const model = args.model ?? "auto";
  const kind = args.kind ?? "analysis";
  const taskId = randomUUID();
  const fail = (error: string): number => {
    const result: TaskResponse = { schemaVersion: 1, ok: false, op: "task", taskId, status: "failed", error,
      provenance: { model: "DERIVED" }, metrics: { prompt_tokens: null, completion_tokens: null,
        total_tokens: null, total_duration: null, load_duration: null, eval_duration: null, tokens_per_second: null } };
    process.stdout.write(`${args.json ? JSON.stringify(result, null, 2) : render(result)}\n`);
    return 1;
  };
  if (args.positional.length !== 1 || args.positional[0] !== "run") {
    return fail("Usage: pudu-ai task run --task TEXT --repo PATH --model auto|NAME [--kind KIND] [--json]");
  }
  if (!task) return fail("--task must be non-empty");
  if (!KINDS.has(kind)) return fail("--kind must be analysis, summary, code_review, test_generation, or documentation");
  if (model !== "auto" && !model.trim()) return fail("--model must be auto or a local model name");
  try {
    if (!(await stat(repo)).isDirectory()) return fail("--repo must name a directory");
  } catch {
    return fail("--repo directory does not exist");
  }
  try {
    const request: TaskRequest = { op: "task", taskId, task, kind, repo, model: model === "auto" ? null : model };
    const invoked = await invokePuduAgent(request, 120_000);
    const response = validateTaskResponse(parseJsonStdout(invoked.stdout));
    process.stdout.write(`${args.json ? JSON.stringify(response, null, 2) : render(response)}\n`);
    return response.ok ? 0 : 1;
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
