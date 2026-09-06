import { formatBytes, bytesToGiB } from "../shared/bytes.js";
import { formatNumber, formatTokensPerSec, na } from "../shared/format.js";
import { memoryLabel } from "../hardware/types.js";
import type { Session } from "../session/load.js";
import type { BenchmarkRecord } from "../storage/benchmarks.js";
import { GRADE_MEANING } from "../compatibility/types.js";

export function hardwareText(session: Session): string {
  const h = session.hardware;
  const ram = formatBytes(h.memory.totalBytes, 0);
  const avail = h.memory.availableBytes ? formatBytes(h.memory.availableBytes) : "N/A";
  return [
    `MACHINE`,
    `  ${h.machineModel ?? "Unknown"}`,
    `  ${h.cpu.name ?? "CPU N/A"}`,
    `  CPU           ${h.cpu.physicalCores ?? "N/A"} cores (${h.cpu.performanceCores ?? "?"}P / ${h.cpu.efficiencyCores ?? "?"}E)`,
    `  GPU           ${h.gpu.name ?? "N/A"}`,
    `  ${memoryLabel(h).padEnd(13)} ${ram}`,
    `  Available     ${avail}`,
    `  ${h.os}         ${h.osVersion ?? h.arch}`,
  ].join("\n");
}

export function runtimesText(session: Session): string {
  return [
    "LOCAL AI RUNTIMES",
    ...session.runtimes.map((r) => `  ${r.detected ? "✓" : "○"} ${r.label.padEnd(14)} ${r.detected ? r.version ?? "detected" : "not detected"}`),
  ].join("\n");
}

export function modelsText(session: Session): string {
  const lines = ["INSTALLED", "MODEL                 INSTALLED   FIT       EST. SPEED     MEASURED"];
  for (const row of session.rows) {
    const fit = row.compatibility?.grade ?? "—";
    const est = row.compatibility?.estimatedTokensPerSecond
      ? `~${formatNumber(row.compatibility.estimatedTokensPerSecond)} t/s`
      : "—";
    const measured = row.lastBenchmark?.benchmark.generationTokensPerSecond
      ? formatTokensPerSec(row.lastBenchmark.benchmark.generationTokensPerSecond)
      : "Not tested";
    lines.push(
      `${row.local.name.padEnd(22)} ✓           ${fit.padEnd(9)} ${est.padEnd(14)} ${measured}`,
    );
  }
  lines.push("", "COMPATIBLE (catalog, estimated)");
  const installed = new Set(session.rows.map((r) => r.local.id.toLowerCase()));
  const extras = session.catalog.slice(0, 12);
  for (const model of extras) {
    if ([...installed].some((id) => id.includes(model.id) || model.id.includes(id.replace(":", "-")))) continue;
    lines.push(`${model.name.padEnd(22)} —           est.`);
  }
  return lines.join("\n");
}

export function recommendText(session: Session): string {
  const lines = ["RECOMMENDED FOR THIS MACHINE", "(estimated unless a local benchmark exists)", ""];
  for (const rec of session.recommendations) {
    lines.push(
      `${rec.useCase.padEnd(12)} ${rec.model.name.padEnd(22)} ${rec.grade}  ${GRADE_MEANING[rec.grade]}  ~${na(rec.estimatedTokensPerSecond)} t/s est.`,
    );
  }
  return lines.join("\n");
}

export function historyText(records: BenchmarkRecord[]): string {
  if (!records.length) return "No benchmark history in ~/.localmeter/benchmarks";
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
    "LocalMeter Doctor",
    "",
    `✓ Node.js       ${node}`,
    `${session.hardware.cpu.appleSilicon ? "✓" : "○"} Apple Silicon ${apple}`,
    `${session.hardware.gpu.metal ? "✓" : "○"} Metal`,
    ...session.runtimes.map((r) => `${r.detected ? "✓" : "○"} ${r.label.padEnd(14)} ${r.version ?? ""}`.trimEnd()),
    `${session.networkUsed ? "✓" : "○"} CanIRun API`,
    "",
    session.llamaBench
      ? `Ready to benchmark ${session.models.filter((m) => m.artifactPath).length} installed models.`
      : "llama-bench unavailable. Install llama.cpp, e.g. `brew install llama.cpp`. LocalMeter will not install native dependencies.",
  ];
  return lines.join("\n");
}

export function reportMarkdown(record: BenchmarkRecord): string {
  const machine = `${record.machine.cpu ?? "unknown"} / ${record.machine.memoryGb ?? "?"} GB`;
  return `## LocalMeter Benchmark

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
| LocalMeter Score | ${record.score?.total ?? "N/A"} / 100 |
`;
}

export function compareText(records: BenchmarkRecord[]): string {
  const latestByModel = new Map<string, BenchmarkRecord>();
  for (const record of records) latestByModel.set(record.model.id, record);
  const list = [...latestByModel.values()].slice(0, 4);
  if (list.length < 2) return "Need at least two measured benchmarks to compare.";
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
    "LOCAL MODEL BENCHMARKS (measured)",
    names.join(" vs "),
    row("Generation t/s", (r) => formatNumber(r.benchmark.generationTokensPerSecond)),
    row("Prompt t/s", (r) => formatNumber(r.benchmark.promptTokensPerSecond)),
    row("Peak RAM", (r) => (r.resources.peakMemoryGb ? `${r.resources.peakMemoryGb} GB` : "N/A")),
    row("Avg CPU", (r) => (r.resources.avgCpuPercent ? `${r.resources.avgCpuPercent}%` : "N/A")),
    row("Power", (r) => (r.resources.avgPackagePowerWatts ? `${r.resources.avgPackagePowerWatts} W` : "N/A")),
    row("t/s/W", (r) => formatNumber(r.resources.tokensPerSecondPerWatt)),
    "",
    "Winner",
    `Speed       ${winner((r) => r.benchmark.generationTokensPerSecond)}`,
    `Memory      ${winner((r) => r.resources.peakMemoryGb, false)}`,
    `Efficiency  ${winner((r) => r.resources.tokensPerSecondPerWatt)}`,
    "Quality     (not derived from speed; see catalog metadata)",
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
    `LocalMeter Score          ${record.score?.total ?? "N/A"}/100`,
    "",
    ...assessment.map((line) => `✓ ${line}`),
  ].join("\n");
}

export function unifiedMemoryGb(session: Session): string {
  return `${bytesToGiB(session.hardware.memory.totalBytes).toFixed(0)} GB ${memoryLabel(session.hardware)}`;
}
