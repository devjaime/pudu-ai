import { Box, Text, useApp, useInput } from "ink";
import { useState, type ReactElement } from "react";
import { GRADE_MEANING } from "../../compatibility/types.js";
import { t } from "../../i18n/index.js";
import { decideLaunch } from "../../integrations/decide.js";
import { executeLaunch } from "../../integrations/execute.js";
import { canInstallGrade, pullOllamaModel } from "../../integrations/pull.js";
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
      setLog(t("launchPulling", { model: rec.model.id }));
      void pullOllamaModel(rec.model.id).then((result) => {
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

  return (
    <Box flexDirection="column">
      <Box borderStyle="round" borderColor="yellow" flexDirection="column" paddingX={1} marginBottom={1}>
        <Text bold color="yellow">
          {t("setupTitle")}
        </Text>
        <Text>{t("setupIntro")}</Text>
      </Box>

      <Text bold color="cyan">
        {t("setupStep1")}
      </Text>
      {recs.length === 0 && <Text dimColor>{t("installNone")}</Text>}
      {recs.map((item, i) => (
        <Text key={`${item.useCase}-${item.model.id}`} color={i === cursor ? "cyan" : undefined}>
          {i === cursor ? "❯ " : "  "}
          <Text color="magenta">{item.useCase.padEnd(12)}</Text>
          {item.model.name.padEnd(22)}{" "}
          <Text color={gradeColor(item.grade)} bold>
            {item.grade}
          </Text>{" "}
          {GRADE_MEANING[item.grade]}
        </Text>
      ))}

      <Box marginTop={1} flexDirection="column">
        <Text bold color="green">
          {t("setupStep2")}
        </Text>
        <Text color="green">{t("setupInstallModel")}</Text>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold color="yellow">
          {t("setupStep3")}
        </Text>
        {session.agents.map((agent, index) => (
          <Text key={agent.id} color={agent.detected ? "green" : "yellow"}>
            [{index + 1}] {agent.detected ? "✓" : "○"} {agent.label.padEnd(12)}{" "}
            {agent.detected ? t("setupLinkNow") : t("setupInstallAgent")}
          </Text>
        ))}
      </Box>

      <Box marginTop={1}>
        <Text dimColor>{t("setupKeys")}</Text>
      </Box>
      {log ? <Text color="green">{log}</Text> : null}
    </Box>
  );
}
