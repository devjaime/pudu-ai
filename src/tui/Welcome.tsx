import { Box, Text } from "ink";
import type { ReactElement } from "react";
import { t } from "../i18n/index.js";
import { Typewriter } from "./Typewriter.js";
import { useCols } from "./width.js";

export function Chrome(): ReactElement {
  const cols = useCols();
  const wide = cols >= 72;
  const brand = `${t("appTitle")}  ${t("byline")}`;
  return (
    <Box flexDirection="column" width={cols} marginBottom={1}>
      <Typewriter text={brand} ms={28} color="cyan" bold once />
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
