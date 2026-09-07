import { t } from "../i18n/index.js";
import { localCompatibility } from "../compatibility/local.js";
import { idsLikelyMatch } from "../models/match.js";
import type { Session } from "../session/load.js";
import { TASK_CATALOG } from "./catalog.js";
import { WORK_KINDS, type ModelTaskPlan, type TaskAnswers, type WorkKind } from "./types.js";

export function parseKinds(raw: string | undefined): WorkKind[] {
  if (!raw) return [...WORK_KINDS];
  const parts = raw.split(",").map((p) => p.trim().toLowerCase());
  const kinds = WORK_KINDS.filter((k) => parts.includes(k));
  return kinds.length ? kinds : [...WORK_KINDS];
}

export function parseAnswers(input: {
  for?: string;
  scope?: string;
  priority?: string;
}): TaskAnswers {
  return {
    kinds: parseKinds(input.for),
    scope: input.scope === "all" ? "all" : "installed",
    priority: input.priority === "quality" || input.priority === "speed" ? input.priority : "balanced",
  };
}

function kindMatches(kind: WorkKind, useCases: string[]): boolean {
  if (kind === "code") return useCases.some((u) => u.includes("code"));
  if (kind === "image") return useCases.some((u) => u.includes("image") || u.includes("vision"));
  if (kind === "video") return useCases.some((u) => u.includes("video"));
  if (kind === "transcription") return useCases.some((u) => u.includes("chat") || u.includes("multilingual"));
  return useCases.some((u) => u.includes("chat") || u.includes("reasoning") || u.includes("code"));
}

export function planTasks(session: Session, answers: TaskAnswers): ModelTaskPlan[] {
  const wanted = new Set(answers.kinds);
  const defs = TASK_CATALOG.filter((task) => wanted.has(task.kind));
  const plans: ModelTaskPlan[] = [];

  const installed = session.rows.map((row) => {
    const useCases = row.catalog?.useCase ?? ["chat", "code"];
    const kinds = answers.kinds.filter((kind) => kindMatches(kind, useCases));
    return {
      modelId: row.local.id,
      modelName: row.local.name,
      installed: true,
      origin: row.lastBenchmark ? ("measured" as const) : ("estimated" as const),
      grade: row.compatibility?.grade,
      useCases,
      kinds,
    };
  });

  const catalogExtras =
    answers.scope === "all"
      ? session.catalog
          .filter((model) => !session.rows.some((row) => idsLikelyMatch(row.local.id, model.id)))
          .map((model) => {
            const useCases = model.useCase ?? [];
            const kinds = answers.kinds.filter((kind) => kindMatches(kind, useCases));
            const fit = localCompatibility(session.hardware, model);
            return {
              modelId: model.id,
              modelName: model.name,
              installed: false,
              origin: "estimated" as const,
              grade: fit.grade,
              useCases,
              kinds,
            };
          })
          .filter((row) => row.kinds.length && row.grade !== "F")
      : [];

  const ranked = [...installed, ...catalogExtras].filter((row) => row.kinds.length);
  ranked.sort((a, b) => {
    if (a.installed !== b.installed) return a.installed ? -1 : 1;
    if (answers.priority === "speed") return (a.grade ?? "C").localeCompare(b.grade ?? "C");
    if (answers.priority === "quality") return (b.grade ?? "C").localeCompare(a.grade ?? "C");
    return 0;
  });

  for (const row of ranked.slice(0, 8)) {
    const tasks = defs
      .filter((def) => row.kinds.includes(def.kind) && def.useCases.some((u) => row.useCases.includes(u) || kindMatches(def.kind, row.useCases)))
      .slice(0, 3)
      .map((def) => ({
        id: def.id,
        harnessId: def.harnessId,
        kind: def.kind,
        title: t(def.titleKey),
        prompt: t(def.promptKey),
      }));
    if (!tasks.length) continue;
    plans.push({
      modelId: row.modelId,
      modelName: row.modelName,
      installed: row.installed,
      origin: row.origin,
      grade: row.grade,
      kinds: row.kinds,
      tasks,
    });
  }

  return plans;
}

export function tasksText(plans: ModelTaskPlan[], answers: TaskAnswers): string {
  const header = [
    t("tasksTitle"),
    t("tasksHint"),
    `${t("tasksKinds")}: ${answers.kinds.join(", ")}`,
    `${t("tasksScope")}: ${answers.scope}`,
    `${t("tasksPriority")}: ${answers.priority}`,
    t("credits"),
    "",
  ];
  if (!plans.length) return [...header, t("tasksEmpty")].join("\n");
  const blocks = plans.map((plan) => {
    const inst = plan.installed ? t("tasksInstalled") : t("tasksNotInstalled");
    const origin = plan.origin === "measured" ? t("measured") : t("estimated");
    const lines = [
      `${plan.modelName}  [${inst}]  ${plan.grade ?? "—"}  ${origin}`,
      `  ${plan.kinds.join(", ")}`,
      ...plan.tasks.map((task) => `  ${task.harnessId}  ${task.title}\n      ${task.prompt}`),
    ];
    return lines.join("\n");
  });
  return [...header, ...blocks].join("\n\n");
}
