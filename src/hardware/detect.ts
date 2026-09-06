import os from "node:os";
import { detectMacosHardware } from "../platform/macos/hardware.js";
import { detectLinuxHardware } from "../platform/linux/hardware.js";
import { detectWindowsHardware } from "../platform/windows/hardware.js";
import type { HardwareProfile, OperatingSystem } from "./types.js";

export function detectOs(): OperatingSystem {
  switch (process.platform) {
    case "darwin":
      return "macos";
    case "linux":
      return "linux";
    case "win32":
      return "windows";
    default:
      return "unknown";
  }
}

export async function detectHardware(): Promise<HardwareProfile> {
  const osName = detectOs();
  if (osName === "macos") return detectMacosHardware();
  if (osName === "linux") return detectLinuxHardware();
  if (osName === "windows") return detectWindowsHardware();
  return {
    os: "unknown",
    arch: os.arch(),
    cpu: { name: os.cpus()[0]?.model, logicalCores: os.cpus().length },
    gpu: {},
    memory: {
      totalBytes: os.totalmem(),
      availableBytes: os.freemem(),
      unified: false,
    },
  };
}
