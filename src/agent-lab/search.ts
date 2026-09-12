import { parseJsonStdout, invokePuduAgent } from "./python-bridge.js";
import { parseSearchResult } from "./schema.js";
import type { SearchIntent, SearchResult } from "./types.js";

export type RepoSearchRequest = {
  repo: string;
  query?: string;
  structuralPattern?: string;
  intent?: SearchIntent;
  globs?: string[];
  limit?: number;
  timeoutMs?: number;
};

export async function searchRepo(request: RepoSearchRequest): Promise<SearchResult> {
  const invoked = await invokePuduAgent({
    op: "search",
    repo: request.repo,
    query: request.query ?? null,
    structuralPattern: request.structuralPattern ?? null,
    intent: request.intent ?? null,
    globs: request.globs ?? [],
    limit: request.limit ?? 100,
    timeoutMs: request.timeoutMs ?? 20_000,
  });
  if (invoked.timedOut) {
    throw new Error("Python search engine timed out");
  }
  let parsed: unknown;
  try {
    parsed = parseJsonStdout(invoked.stdout);
  } catch {
    const err = invoked.stderr.trim() || invoked.stdout.trim() || "invalid JSON from python -m pudu_agent";
    throw new Error(err);
  }
  if (typeof parsed === "object" && parsed && "op" in parsed && (parsed as { op?: string }).op !== "search") {
    throw new Error((parsed as { error?: string }).error ?? "unexpected Python response");
  }
  return parseSearchResult(parsed);
}

export async function classifySearch(input: {
  query?: string;
  structuralPattern?: string;
  intent?: string;
}): Promise<{ intent: SearchIntent; strategies: string[] }> {
  const invoked = await invokePuduAgent({
    op: "classify",
    query: input.query ?? null,
    structuralPattern: input.structuralPattern ?? null,
    intent: input.intent ?? null,
  });
  const parsed = parseJsonStdout(invoked.stdout) as { intent: SearchIntent; strategies: string[] };
  return { intent: parsed.intent, strategies: parsed.strategies };
}
