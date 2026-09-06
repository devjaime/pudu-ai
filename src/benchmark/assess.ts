import type { CatalogModel } from "../compatibility/types.js";
import type { ResourceSummary } from "../telemetry/collector.js";

export function assessRun(input: {
  generationTokensPerSecond?: number;
  resources: ResourceSummary;
  catalog?: CatalogModel;
}): string[] {
  const lines: string[] = [];
  const { generationTokensPerSecond, resources, catalog } = input;
  if (generationTokensPerSecond !== undefined && generationTokensPerSecond >= 25) {
    lines.push("Runs comfortably on this machine");
  } else if (generationTokensPerSecond !== undefined && generationTokensPerSecond >= 10) {
    lines.push("Runs, but generation is constrained");
  } else if (generationTokensPerSecond !== undefined) {
    lines.push("Generation is too slow for interactive use");
  }
  if ((resources.peakSwapGb ?? 0) < 0.05) lines.push("No meaningful swap detected");
  else lines.push("Swap activity detected — memory is tight");
  if (resources.avgGpuPercent !== undefined && resources.avgGpuPercent >= 80) {
    lines.push("GPU remains highly utilized (system-wide)");
  }
  if (generationTokensPerSecond !== undefined && generationTokensPerSecond >= 35) {
    lines.push("Good sustained generation performance");
  }
  if (resources.avgPackagePowerWatts !== undefined && generationTokensPerSecond) {
    const eff = generationTokensPerSecond / resources.avgPackagePowerWatts;
    if (eff >= 2) lines.push("Excellent energy efficiency");
  }
  if (catalog?.useCase?.length) {
    lines.push(`This model is suitable for: ${catalog.useCase.join(", ")}`);
  }
  return lines;
}
