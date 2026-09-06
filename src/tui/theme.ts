export const theme = {
  accent: "cyan",
  good: "green",
  warn: "yellow",
  bad: "red",
  muted: "gray",
  title: "white",
} as const;

export function bar(percent: number | undefined, width = 10): string {
  if (percent === undefined || Number.isNaN(percent)) return `${"░".repeat(width)} N/A`;
  const filled = Math.max(0, Math.min(width, Math.round((percent / 100) * width)));
  return `${"█".repeat(filled)}${"░".repeat(width - filled)}`;
}

export function sparkline(values: number[], width = 24): string {
  const glyphs = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];
  if (!values.length) return glyphs[0]!.repeat(width);
  const slice = values.slice(-width);
  const max = Math.max(...slice, 1);
  return slice
    .map((v) => glyphs[Math.min(glyphs.length - 1, Math.floor((v / max) * (glyphs.length - 1)))]!)
    .join("")
    .padStart(width, glyphs[0]!);
}
