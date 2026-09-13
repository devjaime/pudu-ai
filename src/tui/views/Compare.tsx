import { Box, Text } from "ink";
import type { ReactElement } from "react";
import { formatNumber } from "../../shared/format.js";
import type { BenchmarkRecord } from "../../storage/benchmarks.js";
import { t } from "../../i18n/index.js";
import type { Session } from "../../session/load.js";
import { Panel } from "../layout.js";
import { fit } from "../width.js";

function latest(records: BenchmarkRecord[]): BenchmarkRecord[] {
  const map = new Map<string, BenchmarkRecord>();
  for (const record of records) map.set(record.model.id, record);
  return [...map.values()].slice(0, 4);
}

export function CompareView({ session }: { session: Session }): ReactElement {
  const list = latest(session.history);
  if (list.length < 2) {
    return (
      <Panel title={t("compareTitle")} color="green">
        <Text dimColor>{t("compareHow")}</Text>
        <Text color="yellow">{t("compareNeedBench")}</Text>
      </Panel>
    );
  }

  const row = (label: string, pick: (r: BenchmarkRecord) => string): ReactElement => (
    <Box key={label}>
      <Box width={18}>
        <Text dimColor>{label}</Text>
      </Box>
      {list.map((r) => (
        <Box key={r.model.id} width={14}>
          <Text>{fit(pick(r), 13)}</Text>
        </Box>
      ))}
    </Box>
  );

  return (
    <Panel title={t("compareTitle")} color="green">
      <Box>
        <Box width={18}>
          <Text dimColor> </Text>
        </Box>
        {list.map((r) => (
          <Box key={r.model.id} width={14}>
            <Text bold color="cyan">
              {fit(r.model.id, 13)}
            </Text>
          </Box>
        ))}
      </Box>
      {row("Generation t/s", (r) => formatNumber(r.benchmark.generationTokensPerSecond))}
      {row("Prompt t/s", (r) => formatNumber(r.benchmark.promptTokensPerSecond))}
      {row("Peak RAM", (r) => (r.resources.peakMemoryGb ? `${r.resources.peakMemoryGb} GB` : "N/A"))}
      {row("Avg CPU", (r) => (r.resources.avgCpuPercent ? `${r.resources.avgCpuPercent}%` : "N/A"))}
      {row("Power", (r) => (r.resources.avgPackagePowerWatts ? `${r.resources.avgPackagePowerWatts} W` : "N/A"))}
      {row("t/s/W", (r) => formatNumber(r.resources.tokensPerSecondPerWatt))}
      <Text dimColor>{t("qualityNote")}</Text>
    </Panel>
  );
}
