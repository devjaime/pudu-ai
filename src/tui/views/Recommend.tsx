import { Box, Text } from "ink";
import type { ReactElement } from "react";
import { GRADE_MEANING } from "../../compatibility/types.js";
import { t } from "../../i18n/index.js";
import { resolveOllamaTag } from "../../integrations/ollama-tags.js";
import type { Session } from "../../session/load.js";
import { gradeColor } from "../theme.js";
import { Panel } from "../layout.js";
import { fit } from "../width.js";

export function RecommendView({ session }: { session: Session }): ReactElement {
  return (
    <>
      <Panel title={t("recommended")} color="magenta">
        <Text dimColor>{t("recommendedHint")}</Text>
        {session.recommendations.map((rec) => (
          <Box key={`${rec.useCase}-${rec.model.id}`}>
            <Box width={12}>
              <Text color="magenta">{fit(rec.useCase, 10)}</Text>
            </Box>
            <Box width={24}>
              <Text>{fit(rec.model.name, 22)}</Text>
            </Box>
            <Box width={4}>
              <Text color={gradeColor(rec.grade)}>{rec.grade}</Text>
            </Box>
            <Text dimColor>
              {GRADE_MEANING[rec.grade]}  {resolveOllamaTag(rec.model.id, rec.model.name) ?? "—"}
            </Text>
          </Box>
        ))}
      </Panel>
      <Text color="yellow">{t("setupCta")}</Text>
    </>
  );
}
