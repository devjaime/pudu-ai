import { Box, Text, useApp, useInput } from "ink";
import { useState, type ReactElement } from "react";
import { t } from "../../i18n/index.js";
import { decideLaunch } from "../../integrations/decide.js";
import { executeLaunch } from "../../integrations/execute.js";
import { canInstallGrade, pullOllamaModel } from "../../integrations/pull.js";
import { resolveOllamaTag } from "../../integrations/ollama-tags.js";
import type { IntegrationId } from "../../integrations/types.js";
import type { Session } from "../../session/load.js";
import { gradeColor } from "../theme.js";

const TOOLS: Array<{ key: string; id: IntegrationId; label: string }> = [
  { key: "1", id: "opencode", label: "OpenCode" },
  { key: "2", id: "hermes", label: "Hermes" },
  { key: "3", id: "openclaw", label: "OpenClaw" },
];

export function RecommendView({ session }: { session: Session }): ReactElement {
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
    <Box flexDirection="column">
      <Text bold color="yellow">
        {t("setupTitle")}
      </Text>
      {recs.map((item, i) => (
        <Text key={`${item.useCase}-${item.model.id}`} color={i === cursor ? "cyan" : undefined}>
          {i === cursor ? "❯ " : "  "}
          {item.model.name}{" "}
          <Text color={gradeColor(item.grade)}>{item.grade}</Text>
          <Text dimColor> {resolveOllamaTag(item.model.id, item.model.name) ?? "—"}</Text>
        </Text>
      ))}
      <Text>
        {session.agents.map((agent, index) => (
          <Text key={agent.id} color={agent.detected ? "green" : "gray"}>
            {index ? "  " : ""}
            [{index + 1}]{agent.detected ? "✓" : "○"}
            {agent.label}
          </Text>
        ))}
      </Text>
      <Text dimColor>
        Enter=pull {tag ?? ""} · 1/2/3=agent
      </Text>
      {log ? <Text color="green">{log}</Text> : null}
    </Box>
  );
}
