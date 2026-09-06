import { Box, Text } from "ink";
import type { ReactElement } from "react";
import { modelsText } from "../../cli/text.js";
import type { Session } from "../../session/load.js";

export function ModelsView({ session }: { session: Session }): ReactElement {
  return (
    <Box flexDirection="column">
      <Text>{modelsText(session)}</Text>
      <Text dimColor>FIT and EST. SPEED are estimated. MEASURED comes from local llama-bench history.</Text>
    </Box>
  );
}
