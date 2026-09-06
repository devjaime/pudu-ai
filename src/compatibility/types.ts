export const GRADES = ["S", "A", "B", "C", "D", "F"] as const;
export type Grade = (typeof GRADES)[number];

export type GradeMeaning = {
  grade: Grade;
  label: string;
};

export const GRADE_MEANING: Record<Grade, string> = {
  S: "Excellent",
  A: "Recommended",
  B: "Good",
  C: "Tight",
  D: "CPU/offload",
  F: "Not recommended",
};

export type CatalogModel = {
  id: string;
  name: string;
  provider?: string;
  family?: string;
  params?: string;
  paramsBillions?: number;
  architecture?: string;
  useCase?: string[];
  url?: string;
};

export type CompatibilityResult = {
  modelId: string;
  source: "estimated" | "measured";
  grade: Grade;
  status?: string;
  recommendedQuantization?: string;
  estimatedTokensPerSecond?: number;
  estimatedRamGb?: number;
  notes?: string[];
};

export type Recommendation = {
  useCase: string;
  model: CatalogModel;
  grade: Grade;
  quantization?: string;
  estimatedTokensPerSecond?: number;
};
