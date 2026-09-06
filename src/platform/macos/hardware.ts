import os from "node:os";
import { runCommand } from "../../shared/process.js";
import { parseSizeToBytes } from "../../shared/bytes.js";
import type { AppleSilicon, HardwareProfile } from "../../hardware/types.js";

function parseAppleSilicon(chip: string): AppleSilicon | undefined {
  const match = chip.match(/Apple\s+(M\d+)(?:\s+(Pro|Max|Ultra))?/i);
  if (!match) return undefined;
  const generation = match[1]!.toUpperCase().replace(/^M/, "M");
  const variant = (match[2] as AppleSilicon["variant"] | undefined) ?? "base";
  return { generation, variant };
}

function parseVmStat(output: string, pageSize: number): { availableBytes?: number; swapUsedBytes?: number } {
  const num = (label: string): number | undefined => {
    const row = output.match(new RegExp(`${label}:\\s+([\\d.]+)`));
    if (!row) return undefined;
    return Number(row[1]);
  };
  const free = num("Pages free") ?? 0;
  const speculative = num("Pages speculative") ?? 0;
  const inactive = num("Pages inactive") ?? 0;
  const purgeable = num("Pages purgeable") ?? 0;
  const availableBytes = (free + speculative + inactive + purgeable) * pageSize;
  return { availableBytes };
}

function parseMemoryPressure(output: string): string | undefined {
  const match = output.match(/System-wide memory free percentage:\s+(\d+)/i);
  if (match) {
    const free = Number(match[1]);
    if (free >= 50) return "Nominal";
    if (free >= 25) return "Warn";
    return "Critical";
  }
  if (/warn/i.test(output)) return "Warn";
  if (/critical/i.test(output)) return "Critical";
  if (/nominal/i.test(output)) return "Nominal";
  return undefined;
}

export function parseMacosSwapUsage(output: string): number | undefined {
  const match = output.match(/used\s*=\s*([\d.]+)\s*([KMGT])?/i);
  if (!match) return undefined;
  const value = Number(match[1]);
  if (Number.isNaN(value)) return undefined;
  const unit = (match[2] ?? "M").toUpperCase();
  const factor = { K: 1024, M: 1024 ** 2, G: 1024 ** 3, T: 1024 ** 4 }[unit] ?? 1024 ** 2;
  return value * factor;
}

export async function detectMacosHardware(): Promise<HardwareProfile> {
  const [brand, physical, logical, memsize, pagesize, perf, eff, hwModel, swVers, profiler, vmstat, pressure, swap] =
    await Promise.all([
      runCommand("sysctl", ["-n", "machdep.cpu.brand_string"], { timeout: 5000 }),
      runCommand("sysctl", ["-n", "hw.physicalcpu"], { timeout: 5000 }),
      runCommand("sysctl", ["-n", "hw.logicalcpu"], { timeout: 5000 }),
      runCommand("sysctl", ["-n", "hw.memsize"], { timeout: 5000 }),
      runCommand("sysctl", ["-n", "hw.pagesize"], { timeout: 5000 }),
      runCommand("sysctl", ["-n", "hw.perflevel0.physicalcpu"], { timeout: 5000 }),
      runCommand("sysctl", ["-n", "hw.perflevel1.physicalcpu"], { timeout: 5000 }),
      runCommand("sysctl", ["-n", "hw.model"], { timeout: 5000 }),
      runCommand("sw_vers", ["-productVersion"], { timeout: 5000 }),
      runCommand("system_profiler", ["SPHardwareDataType"], { timeout: 15000 }),
      runCommand("vm_stat", [], { timeout: 5000 }),
      runCommand("memory_pressure", [], { timeout: 5000 }),
      runCommand("sysctl", ["-n", "vm.swapusage"], { timeout: 5000 }),
    ]);

  const profilerText = profiler.stdout;
  const chip =
    profilerText.match(/Chip:\s+(.+)/)?.[1]?.trim() ??
    brand.stdout.trim() ??
    os.cpus()[0]?.model;
  const modelName = profilerText.match(/Model Name:\s+(.+)/)?.[1]?.trim();
  const memoryLine = profilerText.match(/Memory:\s+(.+)/)?.[1]?.trim();
  const totalFromProfiler = memoryLine ? parseSizeToBytes(memoryLine.replace("GB", "GiB")) : undefined;
  const totalBytes = totalFromProfiler ?? Number(memsize.stdout.trim()) ?? os.totalmem();
  const pageSize = Number(pagesize.stdout.trim()) || 16384;
  const vm = parseVmStat(vmstat.stdout, pageSize);
  const appleSilicon = chip ? parseAppleSilicon(chip) : undefined;

  return {
    os: "macos",
    osVersion: swVers.stdout.trim() || undefined,
    arch: os.arch(),
    machineModel: modelName ?? hwModel.stdout.trim() ?? undefined,
    cpu: {
      name: chip,
      physicalCores: Number(physical.stdout.trim()) || os.cpus().length,
      logicalCores: Number(logical.stdout.trim()) || os.cpus().length,
      performanceCores: Number(perf.stdout.trim()) || undefined,
      efficiencyCores: Number(eff.stdout.trim()) || undefined,
      appleSilicon,
    },
    gpu: {
      name: chip,
      metal: Boolean(appleSilicon) || os.arch() === "arm64",
    },
    memory: {
      totalBytes,
      availableBytes: vm.availableBytes ?? os.freemem(),
      unified: Boolean(appleSilicon) || os.arch() === "arm64",
      swapUsedBytes: parseMacosSwapUsage(swap.stdout),
      pressure: parseMemoryPressure(pressure.stdout + pressure.stderr),
    },
  };
}

export function parseAppleSiliconChip(chip: string): AppleSilicon | undefined {
  return parseAppleSilicon(chip);
}

export function parseMacosMemoryPressure(output: string): string | undefined {
  return parseMemoryPressure(output);
}

export function parseMacosVmStat(
  output: string,
  pageSize: number,
): { availableBytes?: number; swapUsedBytes?: number } {
  return parseVmStat(output, pageSize);
}
