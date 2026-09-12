import path from "node:path";
import { t } from "../i18n/index.js";
import { na } from "../shared/format.js";
import type { CliArgs } from "../cli/parse-args.js";
import { findPython } from "./python-bridge.js";
import { searchRepo } from "./search.js";
import type { SearchIntent, SearchResult } from "./types.js";

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
  if (sub !== "search") {
    process.stderr.write(`${t("repoUnknownSubcommand", { sub })}\n`);
    process.stderr.write(`${t("repoHelp")}\n`);
    return 1;
  }

  const python = await findPython();
  if (!python) {
    process.stderr.write(`${t("repoPythonMissing")}\n`);
    return 1;
  }

  const queryParts = args.positional.slice(1);
  const query = queryParts.join(" ").trim() || undefined;
  if (!query && !args.structural) {
    process.stderr.write(`${t("repoNeedQuery")}\n`);
    return 1;
  }

  const intent = asIntent(args.intent);
  const repo = path.resolve(args.repo ?? process.cwd());
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
    const message = error instanceof Error ? error.message : String(error);
    if (args.json) {
      print({ ok: false, error: message }, true);
    } else {
      process.stderr.write(`${message}\n`);
    }
    return 1;
  }
}
