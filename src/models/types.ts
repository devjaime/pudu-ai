export type ModelSource = "ollama" | "llamacpp" | "lmstudio" | "mlx" | "gguf";

export type LocalModel = {
  id: string;
  name: string;
  source: ModelSource;
  sizeBytes?: number;
  digest?: string;
  modifiedAt?: string;
  artifactPath?: string;
  quant?: string;
};

export type ModelArtifact = {
  id: string;
  path: string;
  format: "gguf" | "mlx" | "unknown";
};

export type BenchmarkCapability = "llama-bench" | "none";
