import { Box, Text } from "ink";
import type { ReactElement } from "react";
import { compareText } from "../../cli/text.js";
import { t } from "../../i18n/index.js";
import type { Session } from "../../session/load.js";
import { Typewriter } from "../Typewriter.js";
import { fit, useCols } from "../width.js";

export function CompareView({ session }: { session: Session }): ReactElement {
  const cols = useCols();
  const n = new Set(session.history.map((h) => h.model.id)).size;
  return (
    <Box flexDirection="column" width={cols}>
      <Text bold color="green">
        {t("compareTitle")}
      </Text>
      <Typewriter text={fit(t("compareHow"), cols)} ms={12} dimColor />
      {n < 2 ? (
        <Text color="yellow">{fit(t("compareNeedBench"), cols)}</Text>
      ) : (
        <Text>{compareText(session.history)}</Text>
      )}
    </Box>
  );
}
