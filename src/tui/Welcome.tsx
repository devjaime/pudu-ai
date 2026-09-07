import { Box, Text } from "ink";
import type { ReactElement } from "react";
import { t } from "../i18n/index.js";

export function Welcome({ compact = false }: { compact?: boolean }): ReactElement {
  if (compact) {
    return (
      <Box marginBottom={1}>
        <Text color="yellow">🦌 </Text>
        <Text bold color="cyan">
          {t("appTitle")}
        </Text>
        <Text color="magenta">  {t("byline")}</Text>
      </Box>
    );
  }
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color="yellow">        \/      \/</Text>
      <Text>
        <Text color="yellow">       </Text>
        <Text color="cyan"> (\_   _/)</Text>
      </Text>
      <Text>
        <Text color="cyan">        / </Text>
        <Text color="white">o   o</Text>
        <Text color="cyan"> \</Text>
        <Text>     </Text>
        <Text bold color="green">
          {t("appTitle")}
        </Text>
      </Text>
      <Text>
        <Text color="cyan">        \  </Text>
        <Text color="red">^</Text>
        <Text color="cyan">  /</Text>
        <Text>      </Text>
        <Text color="white">{t("appSubtitle")}</Text>
      </Text>
      <Text>
        <Text color="green">       /|     |\</Text>
        <Text>     </Text>
        <Text bold color="magenta">
          {t("byline")}
        </Text>
      </Text>
      <Text color="green">        U     U</Text>
    </Box>
  );
}

export function ColorNav(): ReactElement {
  return (
    <Box marginTop={1}>
      <Text>
        <Text color="yellow" bold>
          [S]
        </Text>
        <Text color="yellow"> Setup </Text>
        <Text color="green" bold>
          [B]
        </Text>
        <Text color="green"> Bench </Text>
        <Text color="cyan" bold>
          [M]
        </Text>
        <Text color="cyan"> Models </Text>
        <Text color="magenta" bold>
          [R]
        </Text>
        <Text color="magenta"> Rec </Text>
        <Text color="blue" bold>
          [T]
        </Text>
        <Text color="blue"> Tasks </Text>
        <Text color="white" bold>
          [H]
        </Text>
        <Text> HW </Text>
        <Text color="green" bold>
          [C]
        </Text>
        <Text color="green"> Cmp </Text>
        <Text color="cyan" bold>
          [L]
        </Text>
        <Text color="cyan"> Log </Text>
        <Text color="red" bold>
          [Q]
        </Text>
        <Text color="red"> Quit</Text>
      </Text>
    </Box>
  );
}
