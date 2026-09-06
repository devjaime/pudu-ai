import { Box, Text } from "ink";
import type { ReactElement } from "react";
import { formatBytes } from "../../shared/bytes.js";
import { formatTokensPerSec } from "../../shared/format.js";
import { memoryLabel } from "../../hardware/types.js";
import type { Session } from "../../session/load.js";
import { GRADE_MEANING } from "../../compatibility/types.js";
import { t } from "../../i18n/index.js";

export function Dashboard({ session }: { session: Session }): ReactElement {
  const h = session.hardware;
  return (
    <Box flexDirection="column">
      <Box borderStyle="round" borderColor="cyan" flexDirection="column" paddingX={1} marginBottom={1}>
        <Text bold color="cyan">
          {t("appTitle")}
        </Text>
        <Text dimColor>{t("appSubtitle")}</Text>
        <Text dimColor>{t("aboutDashboard")}</Text>
      </Box>

      <Text bold color="cyan">
        {t("machine")}
      </Text>
      <Text>{h.machineModel ?? t("unknownMachine")}</Text>
      <Text>{h.cpu.name ?? t("cpuNa")}</Text>
      <Text>
        CPU           {h.cpu.physicalCores ?? "N/A"} cores
        {h.cpu.performanceCores ? `  (${h.cpu.performanceCores}P/${h.cpu.efficiencyCores ?? "?"}E)` : ""}
      </Text>
      <Text>GPU           {h.gpu.name ?? "N/A"}</Text>
      <Text>
        {memoryLabel(h).padEnd(13)} {formatBytes(h.memory.totalBytes, 0)}
      </Text>
      <Text>Available     {h.memory.availableBytes ? formatBytes(h.memory.availableBytes) : "N/A"}</Text>
      <Text>
        {h.os}         {h.osVersion ?? h.arch}
      </Text>

      <Box marginTop={1} flexDirection="column">
        <Text bold color="cyan">
          {t("runtimes")}
        </Text>
        {session.runtimes.map((r) => (
          <Text key={r.id}>
            {r.detected ? "✓" : "○"} {r.label.padEnd(14)} {r.detected ? r.version ?? t("detected") : t("notDetected")}
          </Text>
        ))}
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold color="cyan">
          {t("installedModels")}
        </Text>
        {session.rows.length === 0 && <Text dimColor>{t("noModels")}</Text>}
        {session.rows.map((row) => (
          <Text key={row.local.id}>
            {row.local.name.padEnd(20)} {row.local.sizeBytes ? formatBytes(row.local.sizeBytes) : "N/A"}  {row.compatibility?.grade ?? "—"}  {row.lastBenchmark?.benchmark.generationTokensPerSecond ? formatTokensPerSec(row.lastBenchmark.benchmark.generationTokensPerSecond) : t("notTested")}
          </Text>
        ))}
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold color="cyan">
          {t("recommended")}
        </Text>
        <Text dimColor>{t("recommendedHint")}</Text>
        {session.recommendations.map((rec) => (
          <Text key={`${rec.useCase}-${rec.model.id}`}>
            {rec.useCase.padEnd(12)} {rec.model.name.padEnd(22)} {rec.grade} {GRADE_MEANING[rec.grade]}
          </Text>
        ))}
        <Text dimColor>{t("credits")}</Text>
      </Box>
    </Box>
  );
}
