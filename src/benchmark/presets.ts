export type BenchmarkPresetName = "quick" | "standard" | "stress" | "custom";

export type BenchmarkPreset = {
  name: BenchmarkPresetName;
  promptTokens: number;
  generationTokens: number;
  repetitions: number;
};

export const PRESETS: Record<Exclude<BenchmarkPresetName, "custom">, BenchmarkPreset> = {
  quick: { name: "quick", promptTokens: 512, generationTokens: 128, repetitions: 3 },
  standard: { name: "standard", promptTokens: 2048, generationTokens: 256, repetitions: 5 },
  stress: { name: "stress", promptTokens: 4096, generationTokens: 512, repetitions: 10 },
};

export function resolvePreset(name: string | undefined): BenchmarkPreset {
  if (name === "standard" || name === "stress" || name === "quick") return PRESETS[name];
  return PRESETS.quick;
}
