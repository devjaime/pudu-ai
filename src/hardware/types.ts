export type OperatingSystem = "macos" | "linux" | "windows" | "unknown";

export type AppleSilicon = {
  generation: string;
  variant: "base" | "Pro" | "Max" | "Ultra" | "unknown";
};

export type CpuInfo = {
  name?: string;
  physicalCores?: number;
  logicalCores?: number;
  performanceCores?: number;
  efficiencyCores?: number;
  appleSilicon?: AppleSilicon;
};

export type GpuInfo = {
  name?: string;
  metal?: boolean;
  vramBytes?: number;
  cores?: number;
};

export type MemoryInfo = {
  totalBytes: number;
  availableBytes?: number;
  unified: boolean;
  swapUsedBytes?: number;
  pressure?: string;
};

export type HardwareProfile = {
  os: OperatingSystem;
  osVersion?: string;
  arch: string;
  machineModel?: string;
  cpu: CpuInfo;
  gpu: GpuInfo;
  memory: MemoryInfo;
};

export function memoryLabel(profile: HardwareProfile): string {
  return profile.memory.unified ? "Unified Memory" : "RAM";
}

export function vramLabel(profile: HardwareProfile): string | undefined {
  if (profile.memory.unified) return undefined;
  if (profile.gpu.vramBytes === undefined) return undefined;
  return "VRAM";
}
