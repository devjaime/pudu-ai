import { z } from "zod";

export type LlamaBenchMetrics = {
  promptTokensPerSecond?: number;
  generationTokensPerSecond?: number;
  modelType?: string;
  modelSizeBytes?: number;
  backend?: string;
  raw: unknown;
};

const jsonRowSchema = z
  .object({
    n_prompt: z.number().optional(),
    n_gen: z.number().optional(),
    avg_ts: z.number().optional(),
    model_type: z.string().optional(),
    model_size: z.number().optional(),
    backends: z.string().optional(),
    test: z.string().optional(),
  })
  .passthrough();

export function parseLlamaBenchJson(text: string): LlamaBenchMetrics {
  const parsed: unknown = JSON.parse(text);
  const rows = Array.isArray(parsed) ? parsed.map((row) => jsonRowSchema.parse(row)) : [jsonRowSchema.parse(parsed)];
  return metricsFromRows(rows, parsed);
}

function metricsFromRows(
  rows: z.infer<typeof jsonRowSchema>[],
  raw: unknown,
): LlamaBenchMetrics {
  let promptTokensPerSecond: number | undefined;
  let generationTokensPerSecond: number | undefined;
  for (const row of rows) {
    const test = row.test ?? "";
    const avg = row.avg_ts;
    if (avg === undefined) continue;
    if (/^pp/i.test(test) || ((row.n_prompt ?? 0) > 0 && (row.n_gen ?? 0) === 0)) {
      promptTokensPerSecond = avg;
    } else if (/^tg/i.test(test) || ((row.n_gen ?? 0) > 0 && (row.n_prompt ?? 0) === 0)) {
      generationTokensPerSecond = avg;
    }
  }
  const first = rows[0];
  return {
    promptTokensPerSecond,
    generationTokensPerSecond,
    modelType: first?.model_type,
    modelSizeBytes: first?.model_size,
    backend: first?.backends,
    raw,
  };
}

export function parseLlamaBenchMarkdown(text: string): LlamaBenchMetrics {
  const rows: Array<{ test: string; ts: number; modelType?: string }> = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.includes("|")) continue;
    const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
    if (cells.length < 6) continue;
    if (/^model$/i.test(cells[0] ?? "") || /^-+$/.test(cells[0] ?? "")) continue;
    const test = cells[cells.length - 2] ?? "";
    const tsCell = cells[cells.length - 1] ?? "";
    const tsMatch = tsCell.match(/([\d.]+)/);
    if (!tsMatch) continue;
    rows.push({ test, ts: Number(tsMatch[1]), modelType: cells[0] });
  }
  let promptTokensPerSecond: number | undefined;
  let generationTokensPerSecond: number | undefined;
  for (const row of rows) {
    if (/^pp/i.test(row.test)) promptTokensPerSecond = row.ts;
    if (/^tg/i.test(row.test)) generationTokensPerSecond = row.ts;
  }
  return {
    promptTokensPerSecond,
    generationTokensPerSecond,
    modelType: rows[0]?.modelType,
    raw: { format: "markdown", rows },
  };
}

export function parseLlamaBenchOutput(text: string): LlamaBenchMetrics {
  const trimmed = text.trim();
  const jsonStart = trimmed.indexOf("[");
  const jsonObjStart = trimmed.indexOf("{");
  const start =
    jsonStart >= 0 && (jsonObjStart < 0 || jsonStart < jsonObjStart) ? jsonStart : jsonObjStart;
  if (start >= 0) {
    const slice = trimmed.slice(start);
    try {
      return parseLlamaBenchJson(slice);
    } catch {
      // fall through to markdown
    }
  }
  return parseLlamaBenchMarkdown(text);
}

export function tokensPerSecondPerWatt(tokensPerSecond?: number, watts?: number): number | undefined {
  if (!tokensPerSecond || !watts || watts <= 0) return undefined;
  return Number((tokensPerSecond / watts).toFixed(2));
}
