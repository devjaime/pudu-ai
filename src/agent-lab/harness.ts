import type { Session } from "../session/load.js";
import { resolveOllamaTag } from "../integrations/ollama-tags.js";
import type { TaskEffortLabel } from "./types.js";

const GRADE_RANK: Record<string, number> = { S: 0, A: 1, B: 2, C: 3, D: 4, F: 5 };

export type HarnessModelPick = {
  modelId: string | null;
  modelName: string | null;
  ollamaTag: string | null;
  grade: string | null;
  measuredTps: number | null;
  reason: string;
  origin: "DERIVED" | null;
};

function isCodeish(useCase: string[] | undefined): boolean {
  const cases = useCase ?? ["chat", "code"];
  return cases.some((item) => item.includes("code") || item.includes("chat"));
}

export function pickHarnessModel(session: Session, effort: { label: TaskEffortLabel }): HarnessModelPick {
  const rows = session.rows.filter((row) => isCodeish(row.catalog?.useCase));
  const pool = rows.length ? rows : session.rows;
  if (!pool.length) {
    return {
      modelId: null,
      modelName: null,
      ollamaTag: null,
      grade: null,
      measuredTps: null,
      reason: "No installed models. N/A",
      origin: null,
    };
  }

  const scored = pool.map((row) => ({
    row,
    grade: row.compatibility?.grade ?? "C",
    tps: row.lastBenchmark?.benchmark.generationTokensPerSecond ?? null,
    params: row.catalog?.paramsBillions ?? null,
  }));

  scored.sort((a, b) => {
    if (effort.label === "LOW") {
      if (a.tps != null && b.tps != null && a.tps !== b.tps) return b.tps - a.tps;
      if (a.tps != null && b.tps == null) return -1;
      if (a.tps == null && b.tps != null) return 1;
      return (GRADE_RANK[a.grade] ?? 9) - (GRADE_RANK[b.grade] ?? 9);
    }
    if (effort.label === "HIGH" || effort.label === "VERY_HIGH") {
      if (a.params != null && b.params != null && a.params !== b.params) return b.params - a.params;
      if (a.params != null && b.params == null) return -1;
      if (a.params == null && b.params != null) return 1;
      return (GRADE_RANK[a.grade] ?? 9) - (GRADE_RANK[b.grade] ?? 9);
    }
    const grade = (GRADE_RANK[a.grade] ?? 9) - (GRADE_RANK[b.grade] ?? 9);
    if (grade !== 0) return grade;
    if (a.tps != null && b.tps != null) return b.tps - a.tps;
    return 0;
  });

  const best = scored[0]!;
  const reasons: Record<TaskEffortLabel, string> = {
    LOW: "LOW effort: prefer fastest measured local coding model; else best grade.",
    MEDIUM: "MEDIUM effort: prefer best hardware grade, then measured t/s.",
    HIGH: "HIGH effort: prefer larger catalog params when known; else best grade.",
    VERY_HIGH: "VERY_HIGH effort: prefer larger catalog params when known; else best grade.",
  };
  return {
    modelId: best.row.local.id,
    modelName: best.row.local.name,
    ollamaTag:
      resolveOllamaTag(best.row.local.id, best.row.local.name, best.row.catalog?.id, best.row.catalog?.name) ??
      (best.row.local.id.includes(":") ? best.row.local.id : null),
    grade: best.grade,
    measuredTps: best.tps,
    reason: reasons[effort.label],
    origin: "DERIVED",
  };
}


