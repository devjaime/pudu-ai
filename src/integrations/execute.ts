import { runCommand } from "../shared/process.js";
import { DOCKER_OLLAMA } from "./agents.js";
import { t } from "../i18n/index.js";
import type { LaunchDecision } from "./types.js";
import { INTEGRATIONS } from "./catalog.js";

export async function executeLaunch(decision: LaunchDecision): Promise<{ ok: boolean; log: string }> {
  if (!decision.eligible || !decision.ollamaTag) {
    return { ok: false, log: t("launchBlocked") };
  }
  const def = INTEGRATIONS[decision.integration];
  if (!def) return { ok: false, log: t("launchUnknown") };

  const lines: string[] = [];
  if (!decision.installed) {
    lines.push(t("launchPulling", { model: decision.ollamaTag }));
    const pull = await runCommand("ollama", ["pull", decision.ollamaTag], { timeout: 30 * 60_000 });
    if (pull.exitCode !== 0) {
      return { ok: false, log: `${lines.join("\n")}\n${pull.stderr || t("launchPullFail")}` };
    }
  }

  const args = ["launch", def.ollamaLaunch, "--model", decision.ollamaTag];
  if (def.id === "openclaw" || def.id === "claude") args.push("--yes");
  lines.push(`ollama ${args.join(" ")}`);
  const launched = await runCommand("ollama", args, { timeout: 120_000 });
  if (launched.exitCode !== 0) {
    return {
      ok: false,
      log: `${lines.join("\n")}\n${launched.stderr || launched.stdout || t("launchExecFail")}`,
    };
  }
  return { ok: true, log: `${lines.join("\n")}\n${launched.stdout}`.trim() };
}

export async function executeDockerOllama(): Promise<{ ok: boolean; log: string }> {
  const args = DOCKER_OLLAMA.split(" ").slice(1);
  const result = await runCommand("docker", args, { timeout: 10 * 60_000 });
  if (result.exitCode !== 0) {
    return { ok: false, log: result.stderr || t("dockerRunFail") };
  }
  return { ok: true, log: t("dockerRunOk") };
}
