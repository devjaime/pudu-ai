import path from "node:path";
import { t } from "../i18n/index.js";
import { na } from "../shared/format.js";
import type { CliArgs } from "../cli/parse-args.js";
import { findPython } from "./python-bridge.js";
import { buildRepoGraph, runRepoHarness } from "./graph.js";
import { searchRepo } from "./search.js";
import type { CodeGraph, SearchIntent, SearchResult } from "./types.js";

const INTENTS: SearchIntent[] = ["TEXT", "STRUCTURAL", "RELATIONSHIP", "IMPACT", "SEMANTIC", "UNKNOWN"];

function print(value: unknown, json: boolean): void {
  if (json) {
    process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
    return;
  }
  process.stdout.write(`${typeof value === "string" ? value : JSON.stringify(value, null, 2)}\n`);
}

function asIntent(raw: string | undefined): SearchIntent | undefined {
  if (!raw) return undefined;
  const value = raw.trim().toUpperCase();
  return INTENTS.find((item) => item === value);
}

export function formatSearchText(result: SearchResult): string {
  const lines = [
    t("repoSearchTitle"),
    "",
    t("aboutRepoSearch"),
    "",
    `Intent     ${result.intent}`,
    `Strategy   ${result.strategy}`,
    `Repo       ${result.repo}`,
    `Matches    ${result.metrics.matchCount}  (${result.metrics.origin})`,
    `Duration   ${result.metrics.durationMs} ms  (${result.metrics.origin})`,
    `rg         ${result.tools.rg.available ? na(result.tools.rg.version) : t("repoToolMissing", { tool: "rg" })}`,
    `ast-grep   ${result.tools.astGrep.available ? na(result.tools.astGrep.version) : t("repoToolMissing", { tool: "ast-grep" })}`,
  ];
  if (result.unavailable.length) {
    lines.push(`Unavailable ${result.unavailable.join(", ")}`);
  }
  for (const err of result.errors) {
    lines.push(`Error      ${err.tool}: ${err.message}  (${err.origin})`);
  }
  lines.push("");
  if (!result.matches.length) {
    lines.push(t("repoNoMatches"));
    return lines.join("\n");
  }
  for (const match of result.matches) {
    const loc = `${match.file}:${na(match.line)}`;
    const snippet = match.text.replace(/\s+/g, " ").slice(0, 160);
    lines.push(`${loc}  [${match.strategy}]  ${snippet}`);
  }
  return lines.join("\n");
}

export async function runRepoCommand(args: CliArgs): Promise<number> {
  const sub = args.positional[0];
  if (!sub || sub === "help") {
    print(t("repoHelp"), args.json);
    return 0;
  }
  const python = await findPython();
  if (!python) {
    process.stderr.write(`${t("repoPythonMissing")}\n`);
    return 1;
  }

  const repo = path.resolve(args.repo ?? process.cwd());

  if (sub === "graph") {
    try {
      const graph = await buildRepoGraph(repo);
      print(args.json ? graph : formatGraphText(graph), args.json);
      return graph.ok ? 0 : 1;
    } catch (error: unknown) {
      return fail(error, args.json);
    }
  }

  if (sub === "harness") {
    const task = args.task ?? args.positional.slice(1).join(" ").trim() ?? "";
    if (!task) {
      process.stderr.write(`${t("repoNeedTask")}\n`);
      return 1;
    }
    try {
      const harness = await runRepoHarness(repo, task);
      print(args.json ? harness : formatGraphText(harness.graph, task), args.json);
      return harness.ok ? 0 : 1;
    } catch (error: unknown) {
      return fail(error, args.json);
    }
  }

  if (sub !== "search") {
    process.stderr.write(`${t("repoUnknownSubcommand", { sub })}\n`);
    process.stderr.write(`${t("repoHelp")}\n`);
    return 1;
  }

  const queryParts = args.positional.slice(1);
  const query = queryParts.join(" ").trim() || undefined;
  if (!query && !args.structural) {
    process.stderr.write(`${t("repoNeedQuery")}\n`);
    return 1;
  }

  const intent = asIntent(args.intent);
  try {
    const result = await searchRepo({
      repo,
      query,
      structuralPattern: args.structural,
      intent,
      globs: args.globs,
      limit: args.limit,
    });
    print(args.json ? result : formatSearchText(result), args.json);
    return result.ok ? 0 : 1;
  } catch (error: unknown) {
    return fail(error, args.json);
  }
}

function fail(error: unknown, json: boolean): number {
  const message = error instanceof Error ? error.message : String(error);
  if (json) print({ ok: false, error: message }, true);
  else process.stderr.write(`${message}\n`);
  return 1;
}

export function formatGraphText(graph: CodeGraph, task?: string): string {
  const e = graph.effort;
  const m = graph.metrics;
  const lines = [
    t("repoGraphTitle"),
    "",
    t("aboutRepoGraph"),
    "",
    `Repo       ${graph.repo}`,
    `Backend    ${graph.backend}`,
    `Files      ${m.fileCount}  (${m.origin})`,
    `Nodes      ${m.nodeCount}  (${m.origin})`,
    `Edges      ${m.edgeCount}  (${m.origin})`,
    `Tokens     ${m.tokenEstimate ?? "N/A"}  (${m.tokenOrigin ?? "N/A"})`,
    `Effort     ${e.label}  ${e.score0to100}/100  (${e.origin})`,
  ];
  if (task) lines.push(`Task       ${task}`);
  if (graph.writtenTo) lines.push(`Wrote      ${graph.writtenTo}`);
  for (const err of graph.errors) {
    lines.push(`Error      ${err.tool}: ${err.message}  (${err.origin})`);
  }
  lines.push("");
  const degree = new Map<string, number>();
  for (const edge of graph.edges) {
    degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
    degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
  }
  const top = [...graph.nodes]
    .filter((n) => n.type === "file" || n.type === "function" || n.type === "test")
    .sort((a, b) => (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0))
    .slice(0, 12);
  for (const node of top) {
    const related = graph.edges
      .filter((edge) => edge.source === node.id)
      .slice(0, 3)
      .map((edge) => `${edge.type}→${edge.symbol ?? edge.target} [${edge.confidence}]`);
    lines.push(`${node.file ?? node.name}  ${node.name}  (${degree.get(node.id) ?? 0})`);
    for (const rel of related) lines.push(`  ${rel}`);
  }
  if (!top.length) lines.push(t("repoGraphEmpty"));
  return lines.join("\n");
}
