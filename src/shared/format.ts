export function formatNumber(value: number | undefined, digits = 1): string {
  if (value === undefined || Number.isNaN(value)) return "N/A";
  return value.toFixed(digits);
}

export function formatPercent(value: number | undefined, digits = 0): string {
  if (value === undefined || Number.isNaN(value)) return "N/A";
  return `${value.toFixed(digits)} %`;
}

export function formatTokensPerSec(value: number | undefined, digits = 1): string {
  if (value === undefined || Number.isNaN(value)) return "N/A";
  return `${value.toFixed(digits)} t/s`;
}

export function formatWatts(value: number | undefined, digits = 1): string {
  if (value === undefined || Number.isNaN(value)) return "N/A";
  return `${value.toFixed(digits)} W`;
}

export function na(value: string | number | undefined | null): string {
  if (value === undefined || value === null || value === "") return "N/A";
  return String(value);
}

export function pad(text: string, width: number, align: "left" | "right" = "left"): string {
  if (text.length >= width) return text.slice(0, width);
  const space = " ".repeat(width - text.length);
  return align === "right" ? space + text : text + space;
}
