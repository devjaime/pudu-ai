import { Box, Text } from "ink";
import type { ReactElement } from "react";
import { hardwareText, runtimesText } from "../../cli/text.js";
import { t } from "../../i18n/index.js";
import type { Session } from "../../session/load.js";

export function HardwareView({ session }: { session: Session }): ReactElement {
  return (
    <Box flexDirection="column">
      <Text>{hardwareText(session)}</Text>
      <Text>{runtimesText(session)}</Text>
      <Text dimColor>{t("hardwareHint")}</Text>
    </Box>
  );
}
