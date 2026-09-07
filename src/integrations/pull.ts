import { runCommand } from "../shared/process.js";
import { t } from "../i18n/index.js";
import type { Grade } from "../compatibility/types.js";
import { toOllamaTag } from "./decide.js";

const INSTALLABLE: Grade[] = ["S", "A", "B"];

export function canInstallGrade(grade: Grade | undefined): boolean {
  return Boolean(grade && INSTALLABLE.includes(grade));
}

export async function pullOllamaModel(modelId: string): Promise<{ ok: boolean; log: string; tag: string }> {
  const tag = toOllamaTag(modelId);
  const result = await runCommand("ollama", ["pull", tag], { timeout: 30 * 60_000 });
  if (result.exitCode !== 0) {
    return { ok: false, log: result.stderr || t("launchPullFail"), tag };
  }
  return { ok: true, log: t("modelPulled", { model: tag }), tag };
}
