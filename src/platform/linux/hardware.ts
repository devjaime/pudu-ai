import os from "node:os";
import type { HardwareProfile } from "../../hardware/types.js";

export async function detectLinuxHardware(): Promise<HardwareProfile> {
  return {
    os: "linux",
    arch: os.arch(),
    cpu: {
      name: os.cpus()[0]?.model,
      logicalCores: os.cpus().length,
    },
    gpu: {},
    memory: {
      totalBytes: os.totalmem(),
      availableBytes: os.freemem(),
      unified: false,
    },
  };
}
