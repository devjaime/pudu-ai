import { Box, Text } from "ink";
import type { ReactElement } from "react";
import { recommendText } from "../../cli/text.js";
import type { Session } from "../../session/load.js";

export function RecommendView({ session }: { session: Session }): ReactElement {
  return (
    <Box flexDirection="column">
      <Text>{recommendText(session)}</Text>
    </Box>
  );
}
