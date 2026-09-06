import { detectOs } from "../hardware/detect.js";
import { createMacosTelemetry } from "./macos.js";
import { nodeTelemetry } from "./fallback.js";
import type { SystemSample, TelemetryProvider } from "./types.js";

export type ResourceSummary = {
  avgCpuPercent?: number;
  avgGpuPercent?: number;
  peakGpuPercent?: number;
  peakMemoryGb?: number;
  peakSwapGb?: number;
  avgPackagePowerWatts?: number;
  peakPackagePowerWatts?: number;
  avgTemperatureC?: number;
  peakTemperatureC?: number;
  peakProcessRssGb?: number;
  samples: number;
};

export function createTelemetry(pid?: number): TelemetryProvider {
  if (detectOs() === "macos") return createMacosTelemetry(pid);
  return nodeTelemetry;
}

export class TelemetryCollector {
  private provider: TelemetryProvider;
  private timer: NodeJS.Timeout | undefined;
  private samples: SystemSample[] = [];
  private running = false;

  constructor(pid?: number) {
    this.provider = createTelemetry(pid);
  }

  async start(intervalMs = 750): Promise<void> {
    await this.provider.start();
    this.running = true;
    const tick = async (): Promise<void> => {
      if (!this.running) return;
      try {
        const sample = await this.provider.sample();
        this.samples.push(sample);
        this.onSample?.(sample);
      } catch {
        // keep collecting
      }
    };
    await tick();
    this.timer = setInterval(() => {
      void tick();
    }, intervalMs);
  }

  onSample?: (sample: SystemSample) => void;

  latest(): SystemSample | undefined {
    return this.samples.at(-1);
  }

  history(): SystemSample[] {
    return this.samples;
  }

  async stop(): Promise<ResourceSummary> {
    this.running = false;
    if (this.timer) clearInterval(this.timer);
    await this.provider.stop();
    return summarize(this.samples);
  }
}

export function summarize(samples: SystemSample[]): ResourceSummary {
  if (samples.length === 0) return { samples: 0 };
  const avg = (values: Array<number | undefined>): number | undefined => {
    const nums = values.filter((v): v is number => v !== undefined && !Number.isNaN(v));
    if (!nums.length) return undefined;
    return Number((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1));
  };
  const peak = (values: Array<number | undefined>): number | undefined => {
    const nums = values.filter((v): v is number => v !== undefined && !Number.isNaN(v));
    if (!nums.length) return undefined;
    return Number(Math.max(...nums).toFixed(2));
  };
  const GiB = 1024 ** 3;
  return {
    samples: samples.length,
    avgCpuPercent: avg(samples.map((s) => s.cpu?.utilizationPercent)),
    avgGpuPercent: avg(samples.map((s) => s.gpu?.utilizationPercent)),
    peakGpuPercent: peak(samples.map((s) => s.gpu?.utilizationPercent)),
    peakMemoryGb: peak(samples.map((s) => s.memory.usedBytes / GiB)),
    peakSwapGb: peak(samples.map((s) => s.memory.swapUsedBytes / GiB)),
    avgPackagePowerWatts: avg(samples.map((s) => s.packagePowerWatts ?? s.cpu?.powerWatts)),
    peakPackagePowerWatts: peak(samples.map((s) => s.packagePowerWatts ?? s.cpu?.powerWatts)),
    avgTemperatureC: avg(samples.map((s) => s.thermal?.temperatureC)),
    peakTemperatureC: peak(samples.map((s) => s.thermal?.temperatureC)),
    peakProcessRssGb: peak(samples.map((s) => (s.process?.rssBytes ?? 0) / GiB)),
  };
}
