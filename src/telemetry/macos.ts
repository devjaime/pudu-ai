import os from "node:os";
import { runCommand } from "../shared/process.js";
import { parseMacosMemoryPressure, parseMacosVmStat } from "../platform/macos/hardware.js";
import { nodeTelemetry } from "./fallback.js";
import type { SystemSample, TelemetryProvider } from "./types.js";

async function sampleProcess(pid?: number): Promise<SystemSample["process"]> {
  if (!pid) return undefined;
  const result = await runCommand("ps", ["-o", "pid=,%cpu=,rss=", "-p", String(pid)], { timeout: 3000 });
  const parts = result.stdout.trim().split(/\s+/);
  if (parts.length < 3) return { pid };
  return {
    pid,
    cpuPercent: Number(parts[1]),
    rssBytes: Number(parts[2]) * 1024,
  };
}

export function createMacosTelemetry(pid?: number): TelemetryProvider {
  return {
    async start() {
      await nodeTelemetry.start();
    },
    async sample() {
      const base = await nodeTelemetry.sample();
      const [vm, pressure, pagesize] = await Promise.all([
        runCommand("vm_stat", [], { timeout: 3000 }),
        runCommand("memory_pressure", [], { timeout: 3000 }),
        runCommand("sysctl", ["-n", "hw.pagesize"], { timeout: 3000 }),
      ]);
      const pageSize = Number(pagesize.stdout.trim()) || 16384;
      const parsed = parseMacosVmStat(vm.stdout, pageSize);
      const total = os.totalmem();
      const available = parsed.availableBytes ?? os.freemem();
      const sample: SystemSample = {
        ...base,
        memory: {
          usedBytes: Math.max(0, total - available),
          availableBytes: available,
          swapUsedBytes: parsed.swapUsedBytes ?? 0,
        },
        thermal: {
          pressure: parseMacosMemoryPressure(pressure.stdout + pressure.stderr),
        },
        process: await sampleProcess(pid),
        gpu: {
          utilizationPercent: undefined,
          powerWatts: undefined,
        },
      };
      return sample;
    },
    async stop() {
      await nodeTelemetry.stop();
    },
  };
}
