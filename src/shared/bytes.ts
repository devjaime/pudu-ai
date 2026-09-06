export const GiB = 1024 ** 3;
export const MiB = 1024 ** 2;

export function bytesToGiB(bytes: number): number {
  return bytes / GiB;
}

export function giBToBytes(gb: number): number {
  return gb * GiB;
}

export function parseSizeToBytes(input: string): number | undefined {
  const match = input.trim().match(/^([\d.]+)\s*(B|KB|MB|GB|TB|KiB|MiB|GiB|TiB)$/i);
  if (!match) return undefined;
  const value = Number(match[1]);
  const unit = match[2]!.toLowerCase();
  const map: Record<string, number> = {
    b: 1,
    kb: 1000,
    mb: 1000 ** 2,
    gb: 1000 ** 3,
    tb: 1000 ** 4,
    kib: 1024,
    mib: 1024 ** 2,
    gib: 1024 ** 3,
    tib: 1024 ** 4,
  };
  const factor = map[unit];
  if (!factor || Number.isNaN(value)) return undefined;
  return value * factor;
}

export function formatBytes(bytes: number, digits = 1): string {
  if (!Number.isFinite(bytes)) return "N/A";
  const abs = Math.abs(bytes);
  if (abs >= GiB) return `${(bytes / GiB).toFixed(digits)} GB`;
  if (abs >= MiB) return `${(bytes / MiB).toFixed(digits)} MB`;
  if (abs >= 1024) return `${(bytes / 1024).toFixed(digits)} KB`;
  return `${Math.round(bytes)} B`;
}
