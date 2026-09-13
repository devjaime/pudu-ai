import { Box, Text } from "ink";
import type { ReactElement } from "react";
import { formatBytes } from "../../shared/bytes.js";
import { formatTokensPerSec } from "../../shared/format.js";
import { memoryLabel } from "../../hardware/types.js";
import type { Session } from "../../session/load.js";
import { t } from "../../i18n/index.js";
import { gradeColor } from "../theme.js";
import { Panel } from "../layout.js";
import { fit, useCols } from "../width.js";

export function Dashboard({ session }: { session: Session }): ReactElement {
  const cols = useCols();
  const h = session.hardware;
  const ollama = session.runtimes.find((r) => r.id === "ollama");
  const lm = session.runtimes.find((r) => r.id === "lmstudio");
  return (
    <>
      <Panel title={t("machine")}>
        <Text>
          {fit(
            `${h.machineModel ?? t("unknownMachine")} · ${h.cpu.name ?? t("cpuNa")} · ${formatBytes(h.memory.totalBytes, 0)} ${memoryLabel(h)}`,
            cols - 4,
          )}
        </Text>
        <Box flexDirection="row" flexWrap="wrap" marginTop={0}>
          {session.runtimes.map((r) => (
            <Box key={r.id} marginRight={2}>
              <Text color={r.detected ? "green" : "gray"}>
                {r.detected ? "✓ " : "○ "}
                {r.label}
              </Text>
            </Box>
          ))}
        </Box>
      </Panel>
      <Panel title={t("installedModels")} color="green">
        {session.rows.length === 0 ? <Text dimColor>{t("noModels")}</Text> : null}
        {session.rows.slice(0, 6).map((row) => (
          <Box key={row.local.id}>
            <Box width={22}>
              <Text color="green">{fit(row.local.name, 20)}</Text>
            </Box>
            <Box width={4}>
              <Text color={gradeColor(row.compatibility?.grade)}>{row.compatibility?.grade ?? "—"}</Text>
            </Box>
            <Text dimColor>
              {row.lastBenchmark?.benchmark.generationTokensPerSecond
                ? formatTokensPerSec(row.lastBenchmark.benchmark.generationTokensPerSecond)
                : t("notTested")}
            </Text>
          </Box>
        ))}
      </Panel>
      <Panel title={t("recommended")} color="magenta">
        {session.recommendations.slice(0, 4).map((rec) => (
          <Box key={`${rec.useCase}-${rec.model.id}`}>
            <Box width={12}>
              <Text color="magenta">{fit(rec.useCase, 10)}</Text>
            </Box>
            <Box width={24}>
              <Text>{fit(rec.model.name, 22)}</Text>
            </Box>
            <Text color={gradeColor(rec.grade)}>{rec.grade}</Text>
          </Box>
        ))}
      </Panel>
      <Box marginBottom={1}>
        <Text color={ollama?.detected ? "green" : "yellow"}>
          {ollama?.detected ? "✓ Ollama" : `○ Ollama  ${t("reqOllama")}`}
        </Text>
      </Box>
      <Box marginBottom={1}>
        <Text color={lm?.detected ? "green" : "gray"}>
          {lm?.detected ? "✓ LM Studio" : `○ LM Studio  ${t("reqLmStudio")}`}
        </Text>
      </Box>
      <Text color="yellow">{t("setupCta")}</Text>
    </>
  );
}
