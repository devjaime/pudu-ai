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

export function RecommendView({ session }: { session: Session }): ReactElement {
  const { exit } = useApp();
  const [cursor, setCursor] = useState(0);
  const [log, setLog] = useState("");
  const [busy, setBusy] = useState(false);
  const recs = session.recommendations;

  useInput((input, key) => {
    if (busy) return;
    if (key.escape) return;
    if (key.upArrow) setCursor((c) => Math.max(0, c - 1));
    if (key.downArrow) setCursor((c) => Math.min(Math.max(recs.length - 1, 0), c + 1));
    const rec = recs[cursor];
    if (input.toLowerCase() === "i" && rec) {
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
    const map: Record<string, IntegrationId> = { o: "opencode", e: "hermes", w: "openclaw" };
    const tool = map[input.toLowerCase()];
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
      <Text bold color="cyan">
        {t("recommended")}
      </Text>
      <Text dimColor>{t("aboutRecommend")}</Text>
      <Text dimColor>{t("recommendKeys")}</Text>
      {recs.map((rec, i) => (
        <Text key={`${rec.useCase}-${rec.model.id}`} color={i === cursor ? "cyan" : undefined}>
          {i === cursor ? "❯ " : "  "}
          <Text color="magenta">{rec.useCase.padEnd(12)}</Text>
          {rec.model.name.padEnd(22)}{" "}
          <Text color={gradeColor(rec.grade)} bold>
            {rec.grade}
          </Text>{" "}
          {GRADE_MEANING[rec.grade]}
        </Text>
      ))}
      <Box marginTop={1} flexDirection="column">
        <Text bold color="yellow">
          {t("agentsTitle")}
        </Text>
        {session.agents.map((agent) => (
          <Text key={agent.id} color={agent.detected ? "green" : "gray"}>
            {agent.detected ? "✓" : "○"} {agent.label.padEnd(12)}{" "}
            {agent.detected ? t("detected") : t("agentMissing")}
          </Text>
        ))}
      </Box>
      {log ? (
        <Text color="green">{log}</Text>
      ) : (
        <Text dimColor>{t("credits")}</Text>
      )}
    </Box>
  );
}
