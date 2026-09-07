import { formatBytes, bytesToGiB } from "../shared/bytes.js";
import { formatNumber, formatTokensPerSec, na } from "../shared/format.js";
import { memoryLabel } from "../hardware/types.js";
import type { Session } from "../session/load.js";
import type { BenchmarkRecord } from "../storage/benchmarks.js";
import { GRADE_MEANING } from "../compatibility/types.js";
import { localCompatibility } from "../compatibility/local.js";
import { idsLikelyMatch } from "../models/match.js";
import { t } from "../i18n/index.js";
import { bold, cyan, dim, gradeAnsi, green, magenta, yellow } from "./color.js";

export function hardwareText(session: Session): string {
  const h = session.hardware;
  const ram = formatBytes(h.memory.totalBytes, 0);
  const avail = h.memory.availableBytes ? formatBytes(h.memory.availableBytes) : "N/A";
  return [
    bold(cyan(t("machine"))),
    `  ${h.machineModel ?? t("unknownMachine")}`,
    `  ${h.cpu.name ?? t("cpuNa")}`,
    `  CPU           ${h.cpu.physicalCores ?? "N/A"} cores (${h.cpu.performanceCores ?? "?"}P / ${h.cpu.efficiencyCores ?? "?"}E)`,
    `  GPU           ${h.gpu.name ?? "N/A"}`,
    `  ${memoryLabel(h).padEnd(13)} ${ram}`,
    `  Available     ${avail}`,
    `  ${h.os}         ${h.osVersion ?? h.arch}`,
  ].join("\n");
}

export function runtimesText(session: Session): string {
  return [
    bold(cyan(t("runtimes"))),
    ...session.runtimes.map((r) => {
      const mark = r.detected ? green("✓") : dim("○");
      const state = r.detected ? green(r.version ?? t("detected")) : dim(t("notDetected"));
      return `  ${mark} ${r.label.padEnd(14)} ${state}`;
    }),
  ].join("\n");
}

export function modelsText(session: Session): string {
  const lines = [bold(cyan(t("installedModels"))), dim("MODEL                 INSTALLED   FIT       EST. SPEED     MEASURED")];
  for (const row of session.rows) {
    const fit = row.compatibility?.grade ?? "—";
    const est = row.compatibility?.estimatedTokensPerSecond
      ? `~${formatNumber(row.compatibility.estimatedTokensPerSecond)} t/s`
      : "—";
    const measured = row.lastBenchmark?.benchmark.generationTokensPerSecond
      ? formatTokensPerSec(row.lastBenchmark.benchmark.generationTokensPerSecond)
      : t("notTested");
    lines.push(
      `${green(row.local.name.padEnd(22))} ✓           ${gradeAnsi(fit).padEnd(9)} ${est.padEnd(14)} ${measured}`,
    );
  }
  lines.push("", t("compatible"));
  const extras = session.catalog
    .filter((model) => !session.rows.some((row) => idsLikelyMatch(row.local.id, model.id)))
    .map((model) => ({ model, fit: localCompatibility(session.hardware, model) }))
    .sort((a, b) => a.fit.grade.localeCompare(b.fit.grade))
    .slice(0, 12);
  for (const extra of extras) {
    const est = extra.fit.estimatedTokensPerSecond
      ? `~${formatNumber(extra.fit.estimatedTokensPerSecond)} t/s`
      : "—";
    lines.push(`${extra.model.name.padEnd(22)} —           ${extra.fit.grade.padEnd(9)} ${est.padEnd(14)} ${t("estimated")}`);
  }
  return lines.join("\n");
}

export function recommendText(session: Session): string {
  const lines = [bold(cyan(t("recommended"))), dim(t("recommendedHint")), "", dim(t("credits")), ""];
  for (const rec of session.recommendations) {
    lines.push(
      `${magenta(rec.useCase.padEnd(12))} ${rec.model.name.padEnd(22)} ${gradeAnsi(rec.grade)}  ${GRADE_MEANING[rec.grade]}  ~${na(rec.estimatedTokensPerSecond)} t/s est.`,
    );
  }
  lines.push("", bold(yellow(t("agentsTitle"))));
  for (const agent of session.agents) {
    lines.push(
      `  ${agent.detected ? green("✓") : dim("○")} ${agent.label.padEnd(12)} ${agent.detected ? green(t("detected")) : dim(t("agentMissing"))}`,
    );
  }
  lines.push("", dim(t("recommendCliHint")));
  return lines.join("\n");
}

export function historyText(records: BenchmarkRecord[]): string {
  if (!records.length) return t("historyEmpty");
  return records
    .map((r) => {
      const gen = r.benchmark.generationTokensPerSecond;
      return `${r.timestamp}  ${r.model.id.padEnd(18)}  ${gen ? formatTokensPerSec(gen) : "N/A"}  score ${r.score?.total ?? "N/A"}`;
    })
    .join("\n");
}

export function historyCsv(records: BenchmarkRecord[]): string {
  const header = "timestamp,model,prompt_tps,generation_tps,peak_memory_gb,avg_cpu,score";
  const rows = records.map((r) =>
    [
      r.timestamp,
      r.model.id,
      r.benchmark.promptTokensPerSecond ?? "",
      r.benchmark.generationTokensPerSecond ?? "",
      r.resources.peakMemoryGb ?? "",
      r.resources.avgCpuPercent ?? "",
      r.score?.total ?? "",
    ].join(","),
  );
  return [header, ...rows].join("\n");
}

export function doctorText(session: Session): string {
  const node = process.version.replace(/^v/, "");
  const apple = session.hardware.cpu.appleSilicon
    ? `${session.hardware.cpu.appleSilicon.generation} ${session.hardware.cpu.appleSilicon.variant}`
    : "no";
  const lines = [
    t("doctorTitle"),
    "",
    `✓ Node.js       ${node}`,
    `${session.hardware.cpu.appleSilicon ? "✓" : "○"} Apple Silicon ${apple}`,
    `${session.hardware.gpu.metal ? "✓" : "○"} Metal`,
    ...session.runtimes.map((r) => `${r.detected ? "✓" : "○"} ${r.label.padEnd(14)} ${r.version ?? ""}`.trimEnd()),
    `${session.networkUsed ? "✓" : "○"} CanIRun.ai (midudev)`,
    ...session.agents.map((a) =>
      `${a.detected ? "✓" : "○"} ${a.label.padEnd(14)} ${a.detected ? t("detected") : a.launch}`,
    ),
    ...(session.runtimes.find((r) => r.id === "ollama")?.detected
      ? []
      : [`○ Ollama        ${t("reqOllama")}`]),
    ...(session.runtimes.find((r) => r.id === "lmstudio")?.detected
      ? []
      : [`○ LM Studio     ${t("reqLmStudio")}`]),
    "",
    session.llamaBench
      ? t("doctorReady", { count: session.models.filter((m) => m.artifactPath).length })
      : t("doctorNoBench"),
  ];
  return lines.join("\n");
}

export function reportMarkdown(record: BenchmarkRecord): string {
  const machine = `${record.machine.cpu ?? "unknown"} / ${record.machine.memoryGb ?? "?"} GB`;
  return `## ${t("reportTitle")}

**Machine:** ${machine}
**Model:** ${record.model.id}

| Metric | Result |
|---|---:|
| Prompt processing | ${record.benchmark.promptTokensPerSecond ?? "N/A"} t/s |
| Generation | ${record.benchmark.generationTokensPerSecond ?? "N/A"} t/s |
| Peak memory | ${record.resources.peakMemoryGb ?? "N/A"} GB |
| Average GPU | ${record.resources.avgGpuPercent ?? "N/A"}% |
| Average power | ${record.resources.avgPackagePowerWatts ?? "N/A"} W |
| Efficiency | ${record.resources.tokensPerSecondPerWatt ?? "N/A"} t/s/W |
| ${t("scoreLabel")} | ${record.score?.total ?? "N/A"} / 100 |
`;
}

export function compareText(records: BenchmarkRecord[]): string {
  const latestByModel = new Map<string, BenchmarkRecord>();
  for (const record of records) latestByModel.set(record.model.id, record);
  const list = [...latestByModel.values()].slice(0, 4);
  if (list.length < 2) return t("compareNeedTwo");
  const names = list.map((r) => r.model.id);
  const row = (label: string, pick: (r: BenchmarkRecord) => string): string =>
    `${label.padEnd(20)}${list.map((r) => pick(r).padStart(14)).join("")}`;
  const winner = (metric: (r: BenchmarkRecord) => number | undefined, higher = true): string => {
    let best: BenchmarkRecord | undefined;
    for (const r of list) {
      const v = metric(r);
      if (v === undefined) continue;
      if (!best) best = r;
      else {
        const b = metric(best);
        if (b === undefined) best = r;
        else if (higher ? v > b : v < b) best = r;
      }
    }
    return best?.model.id ?? "N/A";
  };
  return [
    t("compareTitle"),
    names.join(" vs "),
    row("Generation t/s", (r) => formatNumber(r.benchmark.generationTokensPerSecond)),
    row("Prompt t/s", (r) => formatNumber(r.benchmark.promptTokensPerSecond)),
    row("Peak RAM", (r) => (r.resources.peakMemoryGb ? `${r.resources.peakMemoryGb} GB` : "N/A")),
    row("Avg CPU", (r) => (r.resources.avgCpuPercent ? `${r.resources.avgCpuPercent}%` : "N/A")),
    row("Power", (r) => (r.resources.avgPackagePowerWatts ? `${r.resources.avgPackagePowerWatts} W` : "N/A")),
    row("t/s/W", (r) => formatNumber(r.resources.tokensPerSecondPerWatt)),
    "",
    t("winner"),
    `Speed       ${winner((r) => r.benchmark.generationTokensPerSecond)}`,
    `Memory      ${winner((r) => r.resources.peakMemoryGb, false)}`,
    `Efficiency  ${winner((r) => r.resources.tokensPerSecondPerWatt)}`,
    t("qualityNote"),
  ].join("\n");
}

export function resultText(record: BenchmarkRecord, assessment: string[]): string {
  return [
    record.model.id,
    "",
    `Prompt processing       ${record.benchmark.promptTokensPerSecond ?? "N/A"} t/s`,
    `Generation               ${record.benchmark.generationTokensPerSecond ?? "N/A"} t/s`,
    `Peak memory               ${record.resources.peakMemoryGb ?? "N/A"} GB`,
    `Average GPU                ${record.resources.avgGpuPercent ?? "N/A"} %`,
    `Average CPU                ${record.resources.avgCpuPercent ?? "N/A"} %`,
    `Average power              ${record.resources.avgPackagePowerWatts ?? "N/A"} W`,
    `Efficiency                ${record.resources.tokensPerSecondPerWatt ?? "N/A"} t/s/W`,
    "",
    `${t("scoreLabel")}          ${record.score?.total ?? "N/A"}/100`,
    "",
    ...assessment.map((line) => `✓ ${line}`),
  ].join("\n");
}

export function unifiedMemoryGb(session: Session): string {
  return `${bytesToGiB(session.hardware.memory.totalBytes).toFixed(0)} GB ${memoryLabel(session.hardware)}`;
}
