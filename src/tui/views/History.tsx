import { Box, Text } from "ink";
import type { ReactElement } from "react";
import { historyText } from "../../cli/text.js";
import { t } from "../../i18n/index.js";
import type { Session } from "../../session/load.js";

export function HistoryView({ session }: { session: Session }): ReactElement {
  return (
    <Box flexDirection="column">
      <Text bold color="cyan">
        {t("measured")}
      </Text>
      <Text>{historyText(session.history)}</Text>
    </Box>
  );
}
