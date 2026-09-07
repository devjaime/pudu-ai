import { commandExists } from "../shared/which.js";

export type AgentStatus = {
  id: "opencode" | "hermes" | "openclaw";
  label: string;
  bin: string;
  detected: boolean;
  launch: string;
  docs: string;
};

const AGENTS = [
  {
    id: "opencode" as const,
    label: "OpenCode",
    bin: "opencode",
    launch: "ollama launch opencode",
    docs: "https://docs.ollama.com/integrations/opencode",
  },
  {
    id: "hermes" as const,
    label: "Hermes",
    bin: "hermes",
    launch: "ollama launch hermes",
    docs: "https://docs.ollama.com/integrations/hermes",
  },
  {
    id: "openclaw" as const,
    label: "OpenClaw",
    bin: "openclaw",
    launch: "ollama launch openclaw",
    docs: "https://docs.ollama.com/integrations/openclaw",
  },
];

export async function detectAgents(): Promise<AgentStatus[]> {
  const out: AgentStatus[] = [];
  for (const agent of AGENTS) {
    out.push({
      ...agent,
      detected: Boolean(await commandExists(agent.bin)),
    });
  }
  return out;
}

export const REQ_INSTALL = {
  ollama: "https://ollama.com/download   or   brew install ollama",
  lmstudio: "https://lmstudio.ai",
};
