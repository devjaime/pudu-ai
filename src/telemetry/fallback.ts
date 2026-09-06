import os from "node:os";
import type { SystemSample, TelemetryProvider } from "./types.js";

let previous = os.cpus();

function cpuPercent(): number {
  const current = os.cpus();
  let idle = 0;
  let total = 0;
  for (let i = 0; i < current.length; i += 1) {
    const c = current[i]!;
    const p = previous[i] ?? c;
    const idleDelta = c.times.idle - p.times.idle;
    const totalDelta =
      c.times.user +
      c.times.nice +
      c.times.sys +
      c.times.idle +
      c.times.irq -
      (p.times.user + p.times.nice + p.times.sys + p.times.idle + p.times.irq);
    idle += idleDelta;
    total += totalDelta;
  }
  previous = current;
  if (total <= 0) return 0;
  return Number((100 * (1 - idle / total)).toFixed(1));
}

export const nodeTelemetry: TelemetryProvider = {
  async start() {
    previous = os.cpus();
  },
  async sample() {
    const total = os.totalmem();
    const free = os.freemem();
    const sample: SystemSample = {
      timestamp: Date.now(),
      cpu: { utilizationPercent: cpuPercent() },
      memory: {
        usedBytes: total - free,
        availableBytes: free,
        swapUsedBytes: 0,
      },
    };
    return sample;
  },
  async stop() {
    return;
  },
};
