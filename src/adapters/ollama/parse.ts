import { parseSizeToBytes } from "../../shared/bytes.js";
import type { LocalModel } from "../../models/types.js";

export function parseOllamaList(output: string): LocalModel[] {
  const lines = output.split(/\r?\n/).map((l) => l.trimEnd()).filter(Boolean);
  if (lines.length === 0) return [];
  const header = lines[0] ?? "";
  if (!/^NAME\s+/i.test(header)) {
    return lines.flatMap((line) => parseDataLine(line));
  }
  return lines.slice(1).flatMap((line) => parseDataLine(line));
}

function parseDataLine(line: string): LocalModel[] {
  const parts = line.trim().split(/\s{2,}/);
  if (parts.length < 2) return [];
  const name = parts[0]!;
  if (!name || /^NAME$/i.test(name)) return [];
  const digest = parts[1];
  const sizeRaw = parts[2];
  const modified = parts.slice(3).join(" ") || undefined;
  return [
    {
      id: name,
      name,
      source: "ollama",
      digest,
      sizeBytes: sizeRaw ? parseSizeToBytes(sizeRaw.replace(/([A-Z]+)$/i, " $1")) : undefined,
      modifiedAt: modified,
    },
  ];
}

export function parseOllamaModelfile(modelfile: string): { from?: string } {
  const match = modelfile.match(/^FROM\s+(.+)$/m);
  return { from: match?.[1]?.trim() };
}
