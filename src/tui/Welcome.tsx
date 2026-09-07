import { Box, Text } from "ink";
import type { ReactElement } from "react";
import { t } from "../i18n/index.js";
import { fit, useCols } from "./width.js";

export function Chrome(): ReactElement {
  const cols = useCols();
  const wide = cols >= 72;
  return (
    <Box flexDirection="column" width={cols} marginBottom={1}>
      <Text>
        <Text bold color="cyan">
          {t("appTitle")}
        </Text>
        <Text color="gray"> · </Text>
        <Text color="magenta">{t("byline")}</Text>
        {wide ? (
          <Text color="gray"> · {fit(t("appSubtitle"), cols - 28)}</Text>
        ) : null}
      </Text>
      <Text>
        {wide ? (
          <>
            <Text color="yellow">[S] Setup</Text>
            <Text>  </Text>
            <Text color="green">[B] Bench</Text>
            <Text>  </Text>
            <Text color="cyan">[M] Models</Text>
            <Text>  </Text>
            <Text color="magenta">[R] Rec</Text>
            <Text>  </Text>
            <Text color="blue">[T] Tasks</Text>
            <Text>  </Text>
            <Text>[H] HW</Text>
            <Text>  </Text>
            <Text color="green">[C] Cmp</Text>
            <Text>  </Text>
            <Text color="cyan">[L] Log</Text>
            <Text>  </Text>
            <Text color="red">[Q] Quit</Text>
          </>
        ) : (
          <>
            <Text color="yellow">[S]</Text>
            <Text color="green">[B]</Text>
            <Text color="cyan">[M]</Text>
            <Text color="magenta">[R]</Text>
            <Text color="blue">[T]</Text>
            <Text>[H]</Text>
            <Text color="green">[C]</Text>
            <Text color="cyan">[L]</Text>
            <Text color="red">[Q]</Text>
          </>
        )}
      </Text>
    </Box>
  );
}

export function Welcome({ compact = false }: { compact?: boolean }): ReactElement {
  return <Chrome />;
}

export function ColorNav(): ReactElement {
  return <Chrome />;
}
