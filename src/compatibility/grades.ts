import type { Grade } from "./types.js";

export function gradeFromThresholds(score: number, thresholds: Record<Grade, number>): Grade {
  if (score >= thresholds.S) return "S";
  if (score >= thresholds.A) return "A";
  if (score >= thresholds.B) return "B";
  if (score >= thresholds.C) return "C";
  if (score >= thresholds.D) return "D";
  return "F";
}

export function gradeToScore(grade: Grade): number {
  return { S: 100, A: 85, B: 70, C: 55, D: 40, F: 20 }[grade];
}

export function scoreToGrade(score: number): Grade {
  return gradeFromThresholds(score, { S: 90, A: 80, B: 65, C: 50, D: 35, F: 0 });
}
