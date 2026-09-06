import { t } from "../i18n/index.js";
import type { Grade } from "../compatibility/types.js";
import { localCompatibility } from "../compatibility/local.js";
import type { Session } from "../session/load.js";
import { INTEGRATIONS } from "./catalog.js";
import { INTEGRATION_IDS, type IntegrationId, type LaunchDecision } from "./types.js";

const GRADE_RANK: Record<Grade, number> = { S: 5, A: 4, B: 3, C: 2, D: 1, F: 0 };

export function toOllamaTag(id: string): string {
  const compact = id.toLowerCase().replace(/_/g, "-");
  const match = compact.match(/^([a-z0-9.]+(?:-[a-z0-9.]+)*)-(\d+(?:\.\d+)?b)$/i);
  if (match) return `${match[1]}:${match[2]}`;
  if (compact.includes(":")) return compact;
  return compact;
}

function useCaseOk(useCases: string[] | undefined, needed: string[]): boolean {
  if (!useCases?.length) return needed.includes("chat");
  return useCases.some((u) => needed.some((n) => u.includes(n)));
}

export function decideLaunch(session: Session, id: IntegrationId): LaunchDecision {
  const def = INTEGRATIONS[id]!;
  const reasons: string[] = [];
  const ollama = session.runtimes.find((r) => r.id === "ollama")?.detected;
  if (!ollama) reasons.push(t("launchNeedOllama"));

  type Candidate = {
    modelId: string;
    ollamaTag: string;
    installed: boolean;
    origin: "measured" | "estimated";
    grade?: Grade;
    tps?: number;
  };

  const candidates: Candidate[] = [];
  for (const row of session.rows) {
    const useCases = row.catalog?.useCase ?? ["chat", "code"];
    if (!useCaseOk(useCases, def.useCases)) continue;
    const tps = row.lastBenchmark?.benchmark.generationTokensPerSecond;
    candidates.push({
      modelId: row.local.id,
      ollamaTag: row.local.id.includes(":") ? row.local.id : toOllamaTag(row.local.id),
      installed: true,
      origin: row.lastBenchmark ? "measured" : "estimated",
      grade: row.compatibility?.grade,
      tps,
    });
  }

  if (!candidates.length) {
    for (const model of session.catalog) {
      if (!useCaseOk(model.useCase, def.useCases)) continue;
      const fit = localCompatibility(session.hardware, model);
      if (!def.allowedGrades.includes(fit.grade)) continue;
      candidates.push({
        modelId: model.id,
        ollamaTag: toOllamaTag(model.id),
        installed: false,
        origin: "estimated",
        grade: fit.grade,
      });
    }
  }

  candidates.sort((a, b) => {
    if (a.installed !== b.installed) return a.installed ? -1 : 1;
    return (GRADE_RANK[b.grade ?? "F"] ?? 0) - (GRADE_RANK[a.grade ?? "F"] ?? 0);
  });

  const pick = candidates[0];
  if (!pick) reasons.push(t("launchNoModel"));

  if (pick?.grade && !def.allowedGrades.includes(pick.grade)) {
    reasons.push(t("launchGradeFail", { grade: pick.grade, allowed: def.allowedGrades.join(",") }));
  }
  if (pick?.origin === "measured" && pick.tps !== undefined && pick.tps < def.minGenerationTps) {
    reasons.push(t("launchSlowFail", { tps: pick.tps.toFixed(1), min: def.minGenerationTps }));
  }
  if (pick && pick.origin === "estimated" && (!pick.grade || GRADE_RANK[pick.grade] < GRADE_RANK.B)) {
    reasons.push(t("launchEstimateWeak"));
  }

  const eligible = Boolean(ollama && pick && reasons.length === 0);
  const command = pick
    ? `ollama launch ${def.ollamaLaunch} --model ${pick.ollamaTag}`
    : `ollama launch ${def.ollamaLaunch}`;

  return {
    integration: id,
    docsUrl: def.docsUrl,
    eligible,
    reasons: eligible ? [t("launchOk")] : reasons,
    modelId: pick?.modelId,
    ollamaTag: pick?.ollamaTag,
    installed: pick?.installed ?? false,
    origin: pick?.origin,
    grade: pick?.grade,
    command,
  };
}

export function decideAll(session: Session): LaunchDecision[] {
  return INTEGRATION_IDS.map((id) => decideLaunch(session, id));
}

export function launchText(decisions: LaunchDecision[]): string {
  const lines = [t("launchTitle"), t("launchHint"), ""];
  for (const d of decisions) {
    lines.push(`${d.integration}  ${d.docsUrl}`);
    lines.push(`  ${d.eligible ? "✓" : "○"} ${d.reasons.join(" ")}`);
    if (d.modelId) {
      lines.push(
        `  ${t("launchModel")}: ${d.modelId}  ${d.grade ?? "—"}  ${d.origin === "measured" ? t("measured") : t("estimated")}  ${d.installed ? t("tasksInstalled") : t("tasksNotInstalled")}`,
      );
    }
    lines.push(`  ${d.command}`);
    if (d.eligible) lines.push(`  ${t("launchRunHint", { tool: d.integration })}`);
    else lines.push(`  ${t("launchBlocked")}`);
    lines.push("");
  }
  return lines.join("\n");
}

export function parseIntegration(raw: string | undefined): IntegrationId | undefined {
  if (!raw) return undefined;
  const id = raw.toLowerCase();
  if (id === "claude-code") return "claude";
  return INTEGRATION_IDS.find((item) => item === id);
}
