import { Box, Text } from "ink";
import type { ReactElement } from "react";
import { modelsText } from "../../cli/text.js";
import { t } from "../../i18n/index.js";
import type { Session } from "../../session/load.js";

export function ModelsView({ session }: { session: Session }): ReactElement {
  return (
    <Box flexDirection="column">
      <Text>{modelsText(session)}</Text>
      <Text dimColor>{t("modelsHint")}</Text>
    </Box>
  );
}
