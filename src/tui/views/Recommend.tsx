import { Box, Text } from "ink";
import type { ReactElement } from "react";
import { GRADE_MEANING } from "../../compatibility/types.js";
import { t } from "../../i18n/index.js";
import { resolveOllamaTag } from "../../integrations/ollama-tags.js";
import type { Session } from "../../session/load.js";
import { gradeColor } from "../theme.js";
import { fit, useCols } from "../width.js";

export function RecommendView({ session }: { session: Session }): ReactElement {
  const cols = useCols();
  return (
    <Box flexDirection="column" width={cols}>
      <Text bold color="magenta">
        {t("recommended")}
      </Text>
      <Text dimColor>{fit(t("aboutRecommend"), cols)}</Text>
      {session.recommendations.map((rec) => (
        <Text key={`${rec.useCase}-${rec.model.id}`}>
          <Text color="magenta">{fit(rec.useCase, 10)}</Text>
          <Text> {fit(rec.model.name, 22)} </Text>
          <Text color={gradeColor(rec.grade)}>{rec.grade}</Text>
          <Text> {GRADE_MEANING[rec.grade]}</Text>
          <Text dimColor> {resolveOllamaTag(rec.model.id, rec.model.name) ?? "—"}</Text>
        </Text>
      ))}
      <Text color="yellow">{fit(t("setupCta"), cols)}</Text>
    </Box>
  );
}
