import { Box, Text } from "ink";
import type { ReactElement } from "react";
import { formatBytes } from "../../shared/bytes.js";
import { formatTokensPerSec } from "../../shared/format.js";
import { memoryLabel } from "../../hardware/types.js";
import type { Session } from "../../session/load.js";
import { t } from "../../i18n/index.js";
import { gradeColor } from "../theme.js";
import { fit, useCols } from "../width.js";

export function Dashboard({ session }: { session: Session }): ReactElement {
  const cols = useCols();
  const h = session.hardware;
  const line = fit(
    `${h.machineModel ?? t("unknownMachine")} · ${h.cpu.name ?? t("cpuNa")} · ${formatBytes(h.memory.totalBytes, 0)} ${memoryLabel(h)}`,
    cols,
  );
  return (
    <Box flexDirection="column" width={cols}>
      <Text bold color="cyan">
        {t("machine")}
      </Text>
      <Text>{line}</Text>
      <Text>
        {session.runtimes.map((r, i) => (
          <Text key={r.id} color={r.detected ? "green" : "gray"}>
            {i ? " " : ""}
            {r.detected ? "✓" : "○"}
            {r.label}
          </Text>
        ))}
      </Text>
      <Text bold color="cyan">
        {t("installedModels")}
      </Text>
      {session.rows.length === 0 && <Text dimColor>{t("noModels")}</Text>}
      {session.rows.slice(0, 6).map((row) => (
        <Text key={row.local.id}>
          <Text color="green">{fit(row.local.name, 18)}</Text>
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
      <Text bold color="cyan">
        {t("recommended")}
      </Text>
      {session.recommendations.slice(0, 4).map((rec) => (
        <Text key={`${rec.useCase}-${rec.model.id}`}>
          <Text color="magenta">{fit(rec.useCase, 10)}</Text>
          <Text> {fit(rec.model.name, 22)} </Text>
          <Text color={gradeColor(rec.grade)}>{rec.grade}</Text>
        </Text>
      ))}
      <Text color="yellow">{fit(t("setupCta"), cols)}</Text>
    </Box>
  );
}
