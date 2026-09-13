import { parseJsonStdout, invokePuduAgent } from "./python-bridge.js";
import type { CodeGraph, HarnessResult } from "./types.js";

export async function buildRepoGraph(repo: string, timeoutMs = 60_000): Promise<CodeGraph> {
  const invoked = await invokePuduAgent({ op: "graph", repo }, timeoutMs);
  if (invoked.timedOut) throw new Error("Python graph engine timed out");
  const parsed = parseJsonStdout(invoked.stdout) as CodeGraph;
  if (!parsed || parsed.ok === false) {
    throw new Error((parsed as { error?: string }).error ?? "graph failed");
  }
  return parsed;
}

export async function runRepoHarness(repo: string, task: string | null, timeoutMs = 60_000): Promise<Omit<HarnessResult, "model">> {
  const invoked = await invokePuduAgent({ op: "harness", repo, task }, timeoutMs);
  if (invoked.timedOut) throw new Error("Python harness engine timed out");
  return parseJsonStdout(invoked.stdout) as Omit<HarnessResult, "model">;
}
