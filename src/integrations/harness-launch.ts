import { commandExists } from "../shared/which.js";
import { runCommand } from "../shared/process.js";
import { t } from "../i18n/index.js";
import { findPython } from "../agent-lab/python-bridge.js";
import { INTEGRATIONS } from "./catalog.js";
import { writeOpenCodeHarnessConfig } from "./opencode-config.js";
import type { IntegrationId } from "./types.js";

export type HarnessLaunchRequest = {
  tool: IntegrationId;
  repo: string;
  task: string;
  modelId: string;
  ollamaTag: string;
};

export async function executeHarnessLaunch(req: HarnessLaunchRequest): Promise<{ ok: boolean; log: string }> {
  const def = INTEGRATIONS[req.tool];
  if (!def) return { ok: false, log: t("launchUnknown") };
  const ollama = await commandExists("ollama");
  if (!ollama) return { ok: false, log: t("launchNeedOllama") };

  const lines: string[] = [];
  if (req.tool === "opencode") {
    const python = await findPython();
    if (!python) return { ok: false, log: t("repoPythonMissing") };
    const file = await writeOpenCodeHarnessConfig({
      repo: req.repo,
      ollamaTag: req.ollamaTag,
      pythonBin: python,
    });
    lines.push(t("repoHarnessWroteConfig", { file }));
    const bin = await commandExists("opencode");
    if (bin) {
      lines.push(`${bin}  (${req.ollamaTag})`);
      const launched = await runCommand(bin, [], { cwd: req.repo, timeout: 0, stdio: "inherit" });
      if (launched.exitCode !== 0) {
        return { ok: false, log: `${lines.join("\n")}\n${launched.stderr || t("launchExecFail")}` };
      }
      return { ok: true, log: lines.join("\n") };
    }
  }

  const args = ["launch", def.ollamaLaunch, "--model", req.ollamaTag];
  if (def.id === "openclaw" || def.id === "claude") args.push("--yes");
  lines.push(`ollama ${args.join(" ")}`);
  const launched = await runCommand("ollama", args, { timeout: 0, stdio: "inherit", cwd: req.repo });
  if (launched.exitCode !== 0) {
    return { ok: false, log: `${lines.join("\n")}\n${launched.stderr || t("launchExecFail")}` };
  }
  return { ok: true, log: lines.join("\n") };
}
