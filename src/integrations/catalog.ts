import type { IntegrationDef } from "./types.js";

export const INTEGRATIONS: Record<string, IntegrationDef> = {
  opencode: {
    id: "opencode",
    docsUrl: "https://docs.ollama.com/integrations/opencode",
    ollamaLaunch: "opencode",
    minGenerationTps: 12,
    allowedGrades: ["S", "A", "B"],
    useCases: ["code", "chat", "reasoning"],
  },
  openclaw: {
    id: "openclaw",
    docsUrl: "https://docs.ollama.com/integrations/openclaw",
    ollamaLaunch: "openclaw",
    minGenerationTps: 12,
    allowedGrades: ["S", "A", "B"],
    useCases: ["code", "chat", "reasoning"],
  },
  hermes: {
    id: "hermes",
    docsUrl: "https://docs.ollama.com/integrations/hermes",
    ollamaLaunch: "hermes",
    minGenerationTps: 12,
    allowedGrades: ["S", "A"],
    useCases: ["code", "chat", "reasoning"],
  },
  claude: {
    id: "claude",
    docsUrl: "https://docs.ollama.com/integrations/claude-code",
    ollamaLaunch: "claude",
    minGenerationTps: 12,
    allowedGrades: ["S", "A", "B"],
    useCases: ["code", "chat", "reasoning"],
  },
};
