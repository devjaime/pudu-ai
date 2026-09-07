import { Box, Text } from "ink";
import type { ReactElement } from "react";
import { formatBytes } from "../../shared/bytes.js";
import { formatTokensPerSec } from "../../shared/format.js";
import { memoryLabel } from "../../hardware/types.js";
import type { Session } from "../../session/load.js";
import { t } from "../../i18n/index.js";
import { gradeColor } from "../theme.js";

export function Dashboard({ session }: { session: Session }): ReactElement {
  const h = session.hardware;
  return (
    <Box flexDirection="column">
      <Text>
        <Text color="cyan">{h.machineModel ?? t("unknownMachine")}</Text>
        <Text> · {h.cpu.name ?? t("cpuNa")}</Text>
        <Text> · {h.cpu.physicalCores ?? "?"}c</Text>
        <Text>
          {" "}
          · {formatBytes(h.memory.totalBytes, 0)} {memoryLabel(h)}
        </Text>
      </Text>
      <Text>
        {session.runtimes.map((r, i) => (
          <Text key={r.id} color={r.detected ? "green" : "gray"}>
            {i ? "  " : ""}
            {r.detected ? "✓" : "○"}
            {r.label}
          </Text>
        ))}
      </Text>
      {session.rows.slice(0, 5).map((row) => (
        <Text key={row.local.id}>
          <Text color="green">{row.local.name}</Text>
          <Text> </Text>
          <Text color={gradeColor(row.compatibility?.grade)}>{row.compatibility?.grade ?? "—"}</Text>
          <Text dimColor>
            {" "}
            {row.lastBenchmark?.benchmark.generationTokensPerSecond
              ? formatTokensPerSec(row.lastBenchmark.benchmark.generationTokensPerSecond)
              : t("notTested")}
          </Text>
        </Text>
      ))}
      {session.recommendations.slice(0, 4).map((rec) => (
        <Text key={`${rec.useCase}-${rec.model.id}`}>
          <Text color="magenta">{rec.useCase}</Text>
          <Text> {rec.model.name} </Text>
          <Text color={gradeColor(rec.grade)}>{rec.grade}</Text>
        </Text>
      ))}
      <Text color="yellow">{t("setupCta")}</Text>
    </Box>
  );
}
