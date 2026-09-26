import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { t } from "../i18n/index.js";
import type { Grade } from "../compatibility/types.js";
import { bytesToGiB } from "../shared/bytes.js";
import type { Session } from "../session/load.js";
import {
  canonicalLocalTag,
  classifyOllamaTag,
  GEMMA4_LOCAL_TAGS,
  type TagClass,
} from "./ollama-tags.js";

export const OLLAMA_LOOPBACK = "http://127.0.0.1:11434/v1";
const ALLOWED: Grade[] = ["S", "A", "B"];
const MIN_TPS = 12;
const GRADE_RANK: Record<Grade, number> = { S: 5, A: 4, B: 3, C: 2, D: 1, F: 0 };

const FIT_GB: Record<(typeof GEMMA4_LOCAL_TAGS)[number], { minGb: number; preferred: boolean }> = {
  "gemma4:e2b": { minGb: 8, preferred: true },
  "gemma4:e4b": { minGb: 12, preferred: true },
  "gemma4:12b": { minGb: 16, preferred: false },
  "gemma4:26b": { minGb: 24, preferred: false },
  "gemma4:31b": { minGb: 24, preferred: false },
};

export type AntigravityCandidate = {
  tag: string;
  installed: boolean;
  origin: "measured" | "estimated";
  tps?: number;
};

export type AntigravityInput = {
  ollamaDetected: boolean;
  unifiedMemoryBytes: number;
  baseUrl?: string;
  antigravityDetected: boolean;
  candidates: AntigravityCandidate[];
  requestedTag?: string;
};

export type AntigravityConfig = {
  host: "openai-compatible-local";
  model: string;
  baseUrl: string;
  origin: "pudu-ai";
};

export type AntigravityDecision = {
  host: "openai-compatible-local" | "detect-only";
  integration: "antigravity";
  eligible: boolean;
  reasons: string[];
  tagClass: TagClass;
  modelId?: string;
  ollamaTag?: string;
  installed: boolean;
  origin?: "measured" | "estimated";
  grade?: Grade;
  speedTps: number | null;
  baseUrl: string;
  command: null;
  config: AntigravityConfig | null;
  antigravityDetected: boolean;
  docsUrl: string;
};

export function isLoopbackBaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    return parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost" || parsed.hostname === "::1";
  } catch {
    return false;
  }
}

export function gemma4FitGrade(tag: string, unifiedMemoryBytes: number): Grade | undefined {
  const canonical = canonicalLocalTag(tag)?.replace(/-mlx$/, "");
  if (!canonical || !(canonical in FIT_GB)) return undefined;
  const spec = FIT_GB[canonical as keyof typeof FIT_GB];
  const gb = bytesToGiB(unifiedMemoryBytes);
  if (gb + 1e-9 < spec.minGb) return "F";
  const headroom = gb / spec.minGb;
  if (headroom >= 1.5) return "S";
  if (headroom >= 1.25) return "A";
  return "B";
}

function fitKey(tag: string): string | undefined {
  return canonicalLocalTag(tag)?.replace(/-mlx$/, "");
}

function preferred(tag: string): boolean {
  const key = fitKey(tag);
  if (!key || !(key in FIT_GB)) return false;
  return FIT_GB[key as keyof typeof FIT_GB].preferred;
}

export function decideAntigravity(input: AntigravityInput): AntigravityDecision {
  const baseUrl = input.baseUrl ?? OLLAMA_LOOPBACK;
  const requested = input.requestedTag?.trim();
  const litert = Boolean(requested && requested.toLowerCase().endsWith(".litertlm"));
  const tagClass: TagClass = litert ? "unknown" : requested ? classifyOllamaTag(requested) : "local";
  const reasons: string[] = [];

  if (litert) {
    return {
      host: "detect-only",
      integration: "antigravity",
      eligible: false,
      reasons: [t("launchLiteRtDetectOnly")],
      tagClass: "unknown",
      installed: false,
      speedTps: null,
      baseUrl,
      command: null,
      config: null,
      antigravityDetected: input.antigravityDetected,
      docsUrl: "https://antigravity.google/docs/sdk/local-models",
    };
  }

  if (!isLoopbackBaseUrl(baseUrl)) reasons.push(t("launchNonLoopback"));
  if (!input.ollamaDetected) reasons.push(t("launchNeedOllama"));
  if (requested && tagClass === "cloud") reasons.push(t("launchCloudBlocked"));
  if (requested && tagClass === "unknown") reasons.push(t("launchNoModel"));

  type Pick = AntigravityCandidate & { grade?: Grade };
  let pool: Pick[] = [];
  if (!requested || tagClass === "local") {
    const source: AntigravityCandidate[] =
      requested && tagClass === "local"
        ? [
            {
              tag: canonicalLocalTag(requested) ?? requested,
              installed: input.candidates.some((c) => canonicalLocalTag(c.tag) === canonicalLocalTag(requested)),
              origin: input.candidates.find((c) => canonicalLocalTag(c.tag) === canonicalLocalTag(requested))?.origin ?? "estimated",
              tps: input.candidates.find((c) => canonicalLocalTag(c.tag) === canonicalLocalTag(requested))?.tps,
            },
          ]
        : input.candidates.filter((c) => classifyOllamaTag(c.tag) === "local" && fitKey(c.tag)?.startsWith("gemma4:"));
    pool = source
      .map((c) => ({ ...c, grade: gemma4FitGrade(c.tag, input.unifiedMemoryBytes) }))
      .filter((c) => c.grade && (requested || ALLOWED.includes(c.grade)));
    if (!requested && !pool.length) {
      const fallback = [...GEMMA4_LOCAL_TAGS].reverse().find((tag) => {
        const grade = gemma4FitGrade(tag, input.unifiedMemoryBytes);
        return FIT_GB[tag].preferred && grade && ALLOWED.includes(grade);
      });
      if (fallback) pool.push({ tag: fallback, installed: false, origin: "estimated", grade: gemma4FitGrade(fallback, input.unifiedMemoryBytes) });
    }
  }

  pool.sort((a, b) => {
    if (a.installed !== b.installed) return a.installed ? -1 : 1;
    if (preferred(a.tag) !== preferred(b.tag)) return preferred(a.tag) ? -1 : 1;
    return (GRADE_RANK[b.grade ?? "F"] ?? 0) - (GRADE_RANK[a.grade ?? "F"] ?? 0);
  });

  const pick = pool[0];
  if (!pick) reasons.push(t("launchNoModel"));
  if (pick?.grade && !ALLOWED.includes(pick.grade)) {
    reasons.push(t("launchGradeFail", { grade: pick.grade, allowed: ALLOWED.join(",") }));
  }
  if (pick?.origin === "measured" && pick.tps !== undefined && pick.tps < MIN_TPS) {
    reasons.push(t("launchSlowFail", { tps: pick.tps.toFixed(1), min: MIN_TPS }));
  }
  if (pick && pick.origin === "estimated" && (!pick.grade || GRADE_RANK[pick.grade] < GRADE_RANK.B)) {
    reasons.push(t("launchEstimateWeak"));
  }

  const eligible = reasons.length === 0 && Boolean(pick) && tagClass !== "cloud";
  const model = pick ? (canonicalLocalTag(pick.tag) ?? pick.tag) : undefined;
  const config: AntigravityConfig | null =
    eligible && model
      ? { host: "openai-compatible-local", model, baseUrl, origin: "pudu-ai" }
      : null;

  return {
    host: "openai-compatible-local",
    integration: "antigravity",
    eligible,
    reasons: eligible ? [t("launchOk")] : reasons,
    tagClass: requested ? tagClass : pick ? "local" : "unknown",
    modelId: model,
    ollamaTag: model,
    installed: pick?.installed ?? false,
    origin: pick?.origin,
    grade: pick?.grade,
    speedTps: pick?.origin === "measured" && pick.tps !== undefined ? pick.tps : null,
    baseUrl,
    command: null,
    config,
    antigravityDetected: input.antigravityDetected,
    docsUrl: "https://antigravity.google/docs/sdk/local-models",
  };
}

export function antigravityFromSession(
  session: Session,
  requestedTag: string | undefined,
  antigravityDetected: boolean,
): AntigravityInput {
  const candidates: AntigravityCandidate[] = [];
  for (const row of session.rows) {
    const tag = canonicalLocalTag([row.local.id, row.local.name, row.catalog?.id, row.catalog?.name].filter(Boolean).join(" "));
    if (!tag?.replace(/-mlx$/, "").startsWith("gemma4:")) continue;
    candidates.push({
      tag,
      installed: true,
      origin: row.lastBenchmark ? "measured" : "estimated",
      tps: row.lastBenchmark?.benchmark.generationTokensPerSecond,
    });
  }
  return {
    ollamaDetected: Boolean(session.runtimes.find((r) => r.id === "ollama")?.detected),
    unifiedMemoryBytes: session.hardware.memory.totalBytes,
    antigravityDetected,
    candidates,
    requestedTag,
  };
}

export function antigravityText(decision: AntigravityDecision): string {
  const lines = [
    t("launchAntigravityTitle"),
    t("launchAntigravityHint"),
    "",
    `host       ${decision.host}`,
    `detected   ${decision.antigravityDetected ? "yes" : "no"}`,
    `baseUrl    ${decision.baseUrl}`,
    `tag        ${decision.tagClass}`,
    `command    N/A`,
    `${decision.eligible ? "✓" : "○"} ${decision.reasons.join(" ")}`,
  ];
  if (decision.modelId) {
    lines.push(
      `${t("launchModel")}: ${decision.modelId}  ${decision.grade ?? "—"}  ${decision.origin === "measured" ? t("measured") : t("estimated")}  ${decision.speedTps ?? "N/A"} t/s`,
    );
  }
  if (decision.config) {
    lines.push(t("launchConfigPlan"));
    lines.push(JSON.stringify(decision.config, null, 2));
  }
  if (!decision.eligible) lines.push(t("launchBlocked"));
  return lines.join("\n");
}

export async function writeAntigravityConfig(outPath: string, config: AntigravityConfig): Promise<string> {
  const target = outPath.endsWith(".json") ? outPath : path.join(outPath, "antigravity.local.json");
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  return target;
}
