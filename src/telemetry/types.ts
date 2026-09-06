export type SystemSample = {
  timestamp: number;
  cpu?: {
    utilizationPercent?: number;
    powerWatts?: number;
    frequencyMHz?: number;
  };
  gpu?: {
    utilizationPercent?: number;
    powerWatts?: number;
    frequencyMHz?: number;
  };
  memory: {
    usedBytes: number;
    availableBytes: number;
    swapUsedBytes: number;
  };
  thermal?: {
    temperatureC?: number;
    pressure?: string;
  };
  process?: {
    pid: number;
    cpuPercent?: number;
    rssBytes?: number;
  };
  packagePowerWatts?: number;
};

export interface TelemetryProvider {
  start(): Promise<void>;
  sample(): Promise<SystemSample>;
  stop(): Promise<void>;
}
