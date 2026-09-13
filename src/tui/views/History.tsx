import { Box, Text } from "ink";
import type { ReactElement } from "react";
import { formatTokensPerSec } from "../../shared/format.js";
import { t } from "../../i18n/index.js";
import type { Session } from "../../session/load.js";
import { Panel } from "../layout.js";
import { fit } from "../width.js";

export function HistoryView({ session }: { session: Session }): ReactElement {
  return (
    <Panel title={t("measured")} color="cyan">
      {session.history.length === 0 ? <Text dimColor>{t("historyEmpty")}</Text> : null}
      {session.history.map((r) => (
        <Box key={`${r.timestamp}-${r.model.id}`}>
          <Box width={22}>
            <Text dimColor>{fit(r.timestamp, 20)}</Text>
          </Box>
          <Box width={20}>
            <Text>{fit(r.model.id, 18)}</Text>
          </Box>
          <Box width={12}>
            <Text color="green">
              {r.benchmark.generationTokensPerSecond
                ? formatTokensPerSec(r.benchmark.generationTokensPerSecond)
                : "N/A"}
            </Text>
          </Box>
          <Text dimColor>score {r.score?.total ?? "N/A"}</Text>
        </Box>
      ))}
    </Panel>
  );
}
