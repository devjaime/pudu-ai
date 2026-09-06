import { Box, Text } from "ink";
import type { ReactElement } from "react";
import { compareText } from "../../cli/text.js";
import type { Session } from "../../session/load.js";

export function CompareView({ session }: { session: Session }): ReactElement {
  return (
    <Box flexDirection="column">
      <Text>{compareText(session.history)}</Text>
    </Box>
  );
}
