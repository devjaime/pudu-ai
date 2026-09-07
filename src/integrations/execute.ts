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
  const launched = await runCommand("ollama", args, {
    timeout: 0,
    stdio: "inherit",
  });
  if (launched.exitCode !== 0) {
    return {
      ok: false,
      log: `${lines.join("\n")}\n${launched.stderr || launched.stdout || t("launchExecFail")}`,
    };
  }
  return { ok: true, log: `${lines.join("\n")}\n${launched.stdout}`.trim() };
}

export async function installWithBrew(kind: "ollama" | "lmstudio"): Promise<{ ok: boolean; log: string }> {
  const { brewInstall } = await import("./brew.js");
  if (kind === "ollama") {
    const result = await brewInstall(["install", "ollama"]);
    if (result.ok) {
      void runCommand("ollama", ["serve"], { timeout: 4000 });
    }
    return result;
  }
  return brewInstall(["install", "--cask", "lm-studio"]);
}

export async function executeDockerOllama(): Promise<{ ok: boolean; log: string }> {
  const { brewInstallCask, dockerReady, startDockerDesktop, waitForDocker } = await import("./brew.js");
  const notes: string[] = [];
  if (!(await dockerReady())) {
    notes.push(t("dockerBrewInstall"));
    const installed = await brewInstallCask("docker");
    if (!installed.ok) {
      return { ok: false, log: `${t("reqDocker")}\n${installed.log}` };
    }
    notes.push(t("dockerDesktopWait"));
    await startDockerDesktop();
    const up = await waitForDocker();
    if (!up) return { ok: false, log: `${notes.join("\n")}\n${t("dockerRunFail")}` };
  }
  const start = await runCommand("docker", ["start", "pudu-ollama"], { timeout: 30000 });
  if (start.exitCode === 0) return { ok: true, log: t("dockerRunOk") };
  const args = DOCKER_OLLAMA.split(" ").slice(1);
  const result = await runCommand("docker", args, { timeout: 10 * 60_000 });
  if (result.exitCode !== 0) {
    return { ok: false, log: result.stderr || t("dockerRunFail") };
  }
  return { ok: true, log: t("dockerRunOk") };
}
