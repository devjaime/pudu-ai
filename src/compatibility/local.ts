import { bytesToGiB } from "../shared/bytes.js";
import type { HardwareProfile } from "../hardware/types.js";
import type { CatalogModel, CompatibilityResult, Grade } from "./types.js";

const GB_PER_BILLION_Q4 = 0.65;

export function estimateModelRamGb(model: CatalogModel, quant = "Q4_K_M"): number {
  const params = model.paramsBillions ?? 8;
  const quantFactor: Record<string, number> = {
    Q2_K: 0.4,
    Q3_K_M: 0.5,
    Q4_K_M: 0.65,
    Q5_K_M: 0.8,
    Q6_K: 0.9,
    Q8_0: 1.1,
    F16: 2.0,
  };
  return params * (quantFactor[quant] ?? GB_PER_BILLION_Q4);
}

export function localCompatibility(hardware: HardwareProfile, model: CatalogModel): CompatibilityResult {
  const ramGb = bytesToGiB(hardware.memory.totalBytes);
  const required = estimateModelRamGb(model);
  const ratio = required / ramGb;
  let grade: Grade;
  if (ratio <= 0.35) grade = "S";
  else if (ratio <= 0.5) grade = "A";
  else if (ratio <= 0.7) grade = "B";
  else if (ratio <= 0.9) grade = "C";
  else if (ratio <= 1.15) grade = "D";
  else grade = "F";

  const bandwidthGuess = hardware.cpu.appleSilicon ? 100 : 40;
  const estimatedTokensPerSecond = grade === "F" ? undefined : Math.max(4, bandwidthGuess / Math.max(required, 1));

  return {
    modelId: model.id,
    source: "estimated",
    grade,
    estimatedRamGb: Number(required.toFixed(2)),
    estimatedTokensPerSecond: estimatedTokensPerSecond
      ? Number(estimatedTokensPerSecond.toFixed(1))
      : undefined,
    notes: [`Local estimate from ${required.toFixed(1)} GB Q4 vs ${ramGb.toFixed(1)} GB ${hardware.memory.unified ? "unified memory" : "RAM"}`],
  };
}
