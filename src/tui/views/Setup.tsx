import { Box, Text, useApp, useInput } from "ink";
import { useState, type ReactElement } from "react";
import { t } from "../../i18n/index.js";
import { decideLaunch } from "../../integrations/decide.js";
import { executeDockerOllama, executeLaunch } from "../../integrations/execute.js";
import { canInstallGrade, pullOllamaModel } from "../../integrations/pull.js";
import { resolveOllamaTag } from "../../integrations/ollama-tags.js";
import type { IntegrationId } from "../../integrations/types.js";
import type { Session } from "../../session/load.js";
import { gradeColor } from "../theme.js";
import { Typewriter } from "../Typewriter.js";
import { fit, useCols } from "../width.js";

const TOOLS: Array<{ key: string; id: IntegrationId; label: string }> = [
  { key: "1", id: "opencode", label: "OpenCode" },
  { key: "2", id: "hermes", label: "Hermes" },
  { key: "3", id: "openclaw", label: "OpenClaw" },
];

export function SetupView({ session }: { session: Session }): ReactElement {
  const cols = useCols();
  const { exit } = useApp();
  const [cursor, setCursor] = useState(0);
  const [log, setLog] = useState("");
  const [busy, setBusy] = useState(false);
  const recs = session.recommendations;
  const rec = recs[cursor];

  useInput((input, key) => {
    if (busy) return;
    if (key.upArrow) setCursor((c) => Math.max(0, c - 1));
    if (key.downArrow) setCursor((c) => Math.min(Math.max(recs.length - 1, 0), c + 1));
    if ((input.toLowerCase() === "i" || key.return) && rec) {
      if (!canInstallGrade(rec.grade)) {
        setLog(t("installGradeBlock", { grade: rec.grade }));
        return;
      }
      setBusy(true);
      setLog(t("launchPulling", { model: rec.model.name }));
      void pullOllamaModel(rec.model.id, rec.model.name).then((result) => {
        setLog(result.log);
        setBusy(false);
      });
    }
    if (input === "4") {
      setBusy(true);
      setLog(t("dockerStarting"));
      void executeDockerOllama().then((result) => {
        setLog(result.log);
        setBusy(false);
      });
      return;
    }
    const tool = TOOLS.find((item) => item.key === input)?.id;
    if (tool && rec) {
      const decision = decideLaunch(session, tool);
      if (!decision.eligible) {
        setLog(decision.reasons.join(" "));
        return;
      }
      setBusy(true);
      setLog(t("linkingTool", { tool, model: rec.model.id }));
      void executeLaunch({ ...decision, ollamaTag: decision.ollamaTag, modelId: rec.model.id }).then((result) => {
        setLog(result.log);
        setBusy(false);
        if (result.ok) exit();
      });
    }
  });

  const tag = rec ? resolveOllamaTag(rec.model.id, rec.model.name) : undefined;

  return (
    <Box flexDirection="column" width={cols}>
      <Text bold color="yellow">
        {fit(t("setupTitle"), cols)}
      </Text>
      {recs.map((item, i) => (
        <Text key={`${item.useCase}-${item.model.id}`} color={i === cursor ? "cyan" : undefined}>
          {i === cursor ? "❯ " : "  "}
          {fit(item.model.name, 20)}{" "}
          <Text color={gradeColor(item.grade)}>{item.grade}</Text>
          <Text dimColor> {resolveOllamaTag(item.model.id, item.model.name) ?? "—"}</Text>
        </Text>
      ))}
      {session.agents.map((agent, index) => (
        <Text key={agent.id} color={agent.detected ? "green" : "yellow"}>
          [{index + 1}] {agent.detected ? "✓" : "○"} {agent.label}
          {agent.detected ? "" : `  → ${agent.launch}`}
        </Text>
      ))}
      <Text color={session.runtimes.find((r) => r.id === "docker")?.detected ? "green" : "yellow"}>
        [4] {session.runtimes.find((r) => r.id === "docker")?.detected ? "✓" : "○"} Docker
        {session.runtimes.find((r) => r.id === "docker")?.detected ? `  → ${t("dockerHint")}` : `  → ${t("reqDocker")}`}
      </Text>
      <Text dimColor>
        {fit(
          `Ollama: ${session.runtimes.find((r) => r.id === "ollama")?.detected ? "✓" : t("reqOllama")}  LM Studio: ${session.runtimes.find((r) => r.id === "lmstudio")?.detected ? "✓" : t("reqLmStudio")}`,
          cols,
        )}
      </Text>
      <Typewriter text={fit(`Enter=pull ${tag ?? ""}  1/2/3=agent  Esc=back`, cols)} ms={14} dimColor />
      {log ? <Text color="green">{fit(log, cols)}</Text> : null}
    </Box>
  );
}
