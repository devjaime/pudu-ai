import type { Grade } from "../compatibility/types.js";

export const INTEGRATION_IDS = ["opencode", "openclaw", "hermes", "claude"] as const;
export type IntegrationId = (typeof INTEGRATION_IDS)[number];

export type IntegrationDef = {
  id: IntegrationId;
  docsUrl: string;
  ollamaLaunch: string;
  minGenerationTps: number;
  allowedGrades: Grade[];
  useCases: string[];
};

export type LaunchDecision = {
  integration: IntegrationId;
  docsUrl: string;
  eligible: boolean;
  reasons: string[];
  modelId?: string;
  ollamaTag?: string;
  installed: boolean;
  origin?: "measured" | "estimated";
  grade?: Grade;
  command?: string;
};
