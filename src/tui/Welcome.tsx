import { Box, Text } from "ink";
import type { ReactElement } from "react";
import { t } from "../i18n/index.js";

export function Chrome(): ReactElement {
  return (
    <Box>
      <Text bold color="cyan">
        {t("appTitle")}
      </Text>
      <Text color="magenta"> {t("byline")} </Text>
      <Text color="yellow">[S]</Text>
      <Text color="green">[B]</Text>
      <Text color="cyan">[M]</Text>
      <Text color="magenta">[R]</Text>
      <Text color="blue">[T]</Text>
      <Text>[H]</Text>
      <Text color="green">[C]</Text>
      <Text color="cyan">[L]</Text>
      <Text color="red">[Q]</Text>
    </Box>
  );
}

export function Welcome({ compact = false }: { compact?: boolean }): ReactElement {
  return <Chrome />;
}

export function ColorNav(): ReactElement {
  return <Chrome />;
}
