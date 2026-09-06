import type { BenchmarkCapability, LocalModel, ModelArtifact } from "../models/types.js";

export interface ModelRuntime {
  id: string;
  label: string;
  detect(): Promise<boolean>;
  version(): Promise<string | undefined>;
  listModels(): Promise<LocalModel[]>;
  resolveModel(id: string): Promise<ModelArtifact | undefined>;
  benchmarkCapabilities(): Promise<BenchmarkCapability[]>;
}

export type RuntimeStatus = {
  id: string;
  label: string;
  detected: boolean;
  version?: string;
};
