import { gradeFromThresholds, gradeToScore, scoreToGrade } from "../compatibility/grades.js";
import type { Grade } from "../compatibility/types.js";
import type { ResourceSummary } from "../telemetry/collector.js";

export type DimensionScore = {
  key: "speed" | "memory" | "energy" | "thermal" | "swap";
  grade?: Grade;
  measured: boolean;
  weight: number;
};

export type LocalMeterScore = {
  total?: number;
  dimensions: DimensionScore[];
};

export function computeLocalMeterScore(
  generationTokensPerSecond: number | undefined,
  resources: ResourceSummary,
  totalMemoryGb: number,
): LocalMeterScore {
  const dimensions: DimensionScore[] = [
    {
      key: "speed",
      measured: generationTokensPerSecond !== undefined,
      grade:
        generationTokensPerSecond === undefined
          ? undefined
          : gradeFromThresholds(generationTokensPerSecond, { S: 60, A: 40, B: 25, C: 12, D: 5, F: 0 }),
      weight: 35,
    },
    {
      key: "memory",
      measured: resources.peakMemoryGb !== undefined && totalMemoryGb > 0,
      grade:
        resources.peakMemoryGb === undefined || totalMemoryGb <= 0
          ? undefined
          : gradeFromThresholds(100 - (resources.peakMemoryGb / totalMemoryGb) * 100, {
              S: 50,
              A: 30,
              B: 15,
              C: 5,
              D: 0,
              F: -100,
            }),
      weight: 25,
    },
    {
      key: "energy",
      measured: resources.avgPackagePowerWatts !== undefined && generationTokensPerSecond !== undefined,
      grade: energyGrade(generationTokensPerSecond, resources.avgPackagePowerWatts),
      weight: 20,
    },
    {
      key: "thermal",
      measured: resources.peakTemperatureC !== undefined,
      grade:
        resources.peakTemperatureC === undefined
          ? undefined
          : gradeFromThresholds(100 - resources.peakTemperatureC, { S: 30, A: 20, B: 10, C: 0, D: -10, F: -100 }),
      weight: 10,
    },
    {
      key: "swap",
      measured: resources.peakSwapGb !== undefined,
      grade:
        resources.peakSwapGb === undefined
          ? undefined
          : gradeFromThresholds(4 - resources.peakSwapGb, { S: 4, A: 3.75, B: 3, C: 2, D: 0, F: -100 }),
      weight: 10,
    },
  ];

  const measured = dimensions.filter((d) => d.measured && d.grade);
  const weightSum = measured.reduce((sum, d) => sum + d.weight, 0);
  if (!measured.length || weightSum === 0) return { dimensions };
  const total = measured.reduce((sum, d) => sum + gradeToScore(d.grade!) * (d.weight / weightSum), 0);
  return { total: Math.round(total), dimensions };
}

function energyGrade(tps?: number, watts?: number): Grade | undefined {
  if (!tps || !watts || watts <= 0) return undefined;
  const efficiency = tps / watts;
  return gradeFromThresholds(efficiency, { S: 3, A: 2, B: 1.2, C: 0.6, D: 0.3, F: 0 });
}

export { scoreToGrade };
