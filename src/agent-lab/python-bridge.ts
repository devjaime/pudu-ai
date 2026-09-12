import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runCommand } from "../shared/process.js";
import { commandExists } from "../shared/which.js";

function hasEngine(dir: string): boolean {
  return existsSync(path.join(dir, "pudu_agent", "__main__.py"));
}

export function pythonRoot(): string {
  const starts = [path.dirname(fileURLToPath(import.meta.url)), process.cwd()];
  for (const start of starts) {
    let dir = start;
    for (let i = 0; i < 8; i++) {
      const candidate = path.join(dir, "python");
      if (hasEngine(candidate)) return candidate;
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "python");
}

export async function findPython(): Promise<string | undefined> {
  return (await commandExists("python3")) ?? (await commandExists("python"));
}

export type PythonInvokeResult = {
  stdout: string;
  stderr: string;
  exitCode: number | undefined;
  timedOut: boolean;
  python: string;
};

export async function invokePuduAgent(
  request: unknown,
  timeout = 30_000,
): Promise<PythonInvokeResult> {
  const python = await findPython();
  if (!python) {
    throw new Error("python3 not found on PATH");
  }
  const root = pythonRoot();
  const payload = `${JSON.stringify(request)}\n`;
  const result = await runCommand(python, ["-m", "pudu_agent"], {
    cwd: root,
    env: { ...process.env, PYTHONPATH: root, PYTHONUNBUFFERED: "1" },
    input: payload,
    timeout,
  });
  return { ...result, python };
}

export function parseJsonStdout(stdout: string): unknown {
  const text = stdout.trim();
  if (!text) {
    throw new Error("Python engine returned empty stdout");
  }
  const start = text.indexOf("{");
  const slice = start >= 0 ? text.slice(start) : text;
  return JSON.parse(slice);
}
