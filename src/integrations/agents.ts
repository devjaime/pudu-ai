import { commandExists } from "../shared/which.js";

export type AgentStatus = {
  id: "opencode" | "hermes" | "openclaw";
  label: string;
  bin: string;
  detected: boolean;
};

const AGENTS = [
  { id: "opencode" as const, label: "OpenCode", bin: "opencode" },
  { id: "hermes" as const, label: "Hermes", bin: "hermes" },
  { id: "openclaw" as const, label: "OpenClaw", bin: "openclaw" },
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
