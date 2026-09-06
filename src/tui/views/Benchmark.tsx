import { Box, Text, useInput } from "ink";
import { useEffect, useRef, useState, type ReactElement } from "react";
import { runBenchmark, type BenchmarkResult } from "../../benchmark/engine.js";
import type { LocalModel } from "../../models/types.js";
import type { Session } from "../../session/load.js";
import type { SystemSample } from "../../telemetry/types.js";
import { formatBytes } from "../../shared/bytes.js";
import { formatPercent } from "../../shared/format.js";
import { resultText } from "../../cli/text.js";
import { bar, sparkline } from "../theme.js";
import { memoryLabel } from "../../hardware/types.js";
import { t } from "../../i18n/index.js";

type Phase = "select" | "running" | "done" | "error";

export function BenchmarkView(props: {
  session: Session;
  models: LocalModel[];
  selected: number;
  setSelected: (n: number) => void;
  preset?: string;
  onBack: () => void;
}): ReactElement {
  const [phase, setPhase] = useState<Phase>(props.models.length ? "select" : "error");
  const [sample, setSample] = useState<SystemSample | undefined>();
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<BenchmarkResult | undefined>();
  const [error, setError] = useState(props.models.length ? "" : t("noGguf"));
  const cpuHist = useRef<number[]>([]);
  const memHist = useRef<number[]>([]);
  const abortRef = useRef<AbortController | undefined>(undefined);

  useInput((input, key) => {
    if (phase === "select") {
      if (key.upArrow) props.setSelected(Math.max(0, props.selected - 1));
      if (key.downArrow) props.setSelected(Math.min(props.models.length - 1, props.selected + 1));
      if (key.return && props.models[props.selected]) setPhase("running");
      if (input.toLowerCase() === "q" || key.escape) props.onBack();
    } else if (phase === "running" && (input.toLowerCase() === "q" || key.escape)) {
      abortRef.current?.abort();
    } else if ((phase === "done" || phase === "error") && (input.toLowerCase() === "q" || key.escape || key.return)) {
      props.onBack();
    }
  });

  useEffect(() => {
    if (phase !== "running") return;
    const model = props.models[props.selected];
    if (!model) return;
    const controller = new AbortController();
    abortRef.current = controller;
    void (async () => {
      try {
        const catalog = props.session.rows.find((r) => r.local.id === model.id)?.catalog;
        const out = await runBenchmark({
          model,
          hardware: props.session.hardware,
          preset: props.preset,
          catalog,
          signal: controller.signal,
          onProgress: (p) => {
            setElapsed(p.elapsedSeconds);
            if (p.sample) {
              setSample(p.sample);
              if (p.sample.cpu?.utilizationPercent !== undefined) {
                cpuHist.current = [...cpuHist.current, p.sample.cpu.utilizationPercent].slice(-32);
              }
              memHist.current = [...memHist.current, p.sample.memory.usedBytes].slice(-32);
            }
          },
        });
        setResult(out);
        setPhase("done");
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setPhase("error");
      }
    })();
    return () => controller.abort();
  }, [phase, props.models, props.preset, props.selected, props.session]);

  const h = props.session.hardware;
  const model = props.models[props.selected];

  if (phase === "select") {
    return (
      <Box flexDirection="column">
        <Text bold>{t("selectBenchmark")}</Text>
        {props.models.map((m, i) => (
          <Text key={m.id} color={i === props.selected ? "cyan" : undefined}>
            {i === props.selected ? "❯ " : "  "}
            {m.name}
          </Text>
        ))}
        <Text dimColor>{t("enterToRun")}</Text>
      </Box>
    );
  }

  if (phase === "done" && result) {
    return (
      <Box flexDirection="column">
        <Text>{resultText(result.record, result.assessment)}</Text>
        <Text dimColor>
          {t("saved")} {result.path}
        </Text>
      </Box>
    );
  }

  if (phase === "error") {
    return (
      <Box flexDirection="column">
        <Text color="red">{error}</Text>
      </Box>
    );
  }

  const cpu = sample?.cpu?.utilizationPercent;
  const gpu = sample?.gpu?.utilizationPercent;
  const memUsed = sample?.memory.usedBytes;
  const memTotal = h.memory.totalBytes;

  return (
    <Box flexDirection="column">
      <Box borderStyle="round" borderColor="cyan" flexDirection="column" paddingX={1}>
        <Text bold>{t("benchmarkTitle")}</Text>
        <Text>{model?.name}</Text>
        <Text dimColor>
          {h.cpu.name} · {formatBytes(h.memory.totalBytes, 0)} {memoryLabel(h)}
        </Text>
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text bold color="cyan">
          {t("performance")}
        </Text>
        <Text>
          {t("elapsed")}                    {elapsed.toFixed(1)} s
        </Text>
        <Text dimColor>{t("measuredAfter")}</Text>
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text bold color="cyan">
          {t("system")}
        </Text>
        <Text>
          CPU       {bar(cpu)}       {formatPercent(cpu)}
        </Text>
        <Text>
          GPU       {bar(gpu)}       {formatPercent(gpu)}
        </Text>
        <Text>
          Memory    {bar(memUsed && memTotal ? (memUsed / memTotal) * 100 : undefined)}      {memUsed ? formatBytes(memUsed) : "N/A"} / {formatBytes(memTotal, 0)}
        </Text>
        <Text>Swap      {bar(0)}      {sample ? formatBytes(sample.memory.swapUsedBytes) : "N/A"}</Text>
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text bold color="cyan">
          {t("powerThermals")}
        </Text>
        <Text>Package                    {sample?.packagePowerWatts ?? "N/A"} W</Text>
        <Text>Temperature                {sample?.thermal?.temperatureC ?? "N/A"} °C</Text>
        <Text>Thermal Pressure           {sample?.thermal?.pressure ?? "N/A"}</Text>
        <Text dimColor>{t("permissionsHint")}</Text>
      </Box>
      <Text>
        {sparkline(cpuHist.current)} CPU
      </Text>
      <Text>
        {sparkline(memHist.current.map((v) => v / (1024 ** 3)))} Memory
      </Text>
      <Text dimColor>{t("cancelHint")}</Text>
    </Box>
  );
}
