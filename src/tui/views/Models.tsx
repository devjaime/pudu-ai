import { Box, Text } from "ink";
import type { ReactElement } from "react";
import { formatNumber, formatTokensPerSec } from "../../shared/format.js";
import { localCompatibility } from "../../compatibility/local.js";
import { idsLikelyMatch } from "../../models/match.js";
import { t } from "../../i18n/index.js";
import type { Session } from "../../session/load.js";
import { gradeColor } from "../theme.js";
import { Panel } from "../layout.js";
import { fit } from "../width.js";

export function ModelsView({ session }: { session: Session }): ReactElement {
  const extras = session.catalog
    .filter((model) => !session.rows.some((row) => idsLikelyMatch(row.local.id, model.id)))
    .map((model) => ({ model, fit: localCompatibility(session.hardware, model) }))
    .sort((a, b) => a.fit.grade.localeCompare(b.fit.grade))
    .slice(0, 8);

  return (
    <>
      <Panel title={t("installedModels")} color="green">
        <Box>
          <Box width={22}>
            <Text dimColor>MODEL</Text>
          </Box>
          <Box width={6}>
            <Text dimColor>FIT</Text>
          </Box>
          <Box width={14}>
            <Text dimColor>EST.</Text>
          </Box>
          <Text dimColor>MEASURED</Text>
        </Box>
        {session.rows.length === 0 ? <Text dimColor>{t("noModels")}</Text> : null}
        {session.rows.map((row) => (
          <Box key={row.local.id}>
            <Box width={22}>
              <Text color="green">{fit(row.local.name, 20)}</Text>
            </Box>
            <Box width={6}>
              <Text color={gradeColor(row.compatibility?.grade)}>{row.compatibility?.grade ?? "—"}</Text>
            </Box>
            <Box width={14}>
              <Text dimColor>
                {row.compatibility?.estimatedTokensPerSecond
                  ? `~${formatNumber(row.compatibility.estimatedTokensPerSecond)} t/s`
                  : "—"}
              </Text>
            </Box>
            <Text>
              {row.lastBenchmark?.benchmark.generationTokensPerSecond
                ? formatTokensPerSec(row.lastBenchmark.benchmark.generationTokensPerSecond)
                : t("notTested")}
            </Text>
          </Box>
        ))}
      </Panel>
      <Panel title={t("compatible")} color="yellow">
        {extras.map((extra) => (
          <Box key={extra.model.id}>
            <Box width={22}>
              <Text>{fit(extra.model.name, 20)}</Text>
            </Box>
            <Box width={6}>
              <Text color={gradeColor(extra.fit.grade)}>{extra.fit.grade}</Text>
            </Box>
            <Text dimColor>
              {extra.fit.estimatedTokensPerSecond ? `~${formatNumber(extra.fit.estimatedTokensPerSecond)} t/s` : "—"}{" "}
              {t("estimated")}
            </Text>
          </Box>
        ))}
      </Panel>
      <Text color="yellow">{t("modelsHint")}</Text>
    </>
  );
}
