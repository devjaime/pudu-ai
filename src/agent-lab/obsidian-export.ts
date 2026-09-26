import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const PUDU_EXPORT_MARK = "<!-- pudu-ai-export -->";

export type ExportNote = { relativePath: string; body: string };

export type ExportPlan = { notes: ExportNote[] };

export type ExportGraph = {
  nodes: Array<{ id: string; name: string; type: string; file: string | null }>;
  edges: Array<{ source: string; target: string; type: string; confidence: string; symbol: string | null }>;
};

export type ExportResult = {
  wrote: boolean;
  planned: string[];
  written: string[];
  skipped: string[];
};

function safeName(file: string | null, id: string): string | undefined {
  const raw = (file ?? `${id}.md`).replaceAll("\\", "/");
  const norm = path.posix.normalize(raw).replace(/^\/+/, "");
  if (!norm || norm.startsWith("..") || norm.split("/").includes("..")) return undefined;
  if (norm.split("/").includes(".obsidian")) return undefined;
  return norm.toLowerCase().endsWith(".md") ? norm : `${norm}.md`;
}

export function planObsidianExport(graph: ExportGraph): ExportPlan {
  const notes: ExportNote[] = [];
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  for (const node of graph.nodes) {
    if (node.type !== "note" && node.type !== "file") continue;
    const relativePath = safeName(node.file, node.id);
    if (!relativePath || relativePath === "pudu-ai-index.md") continue;
    const links = graph.edges
      .filter((edge) => edge.source === node.id)
      .map((edge) => {
        const target = byId.get(edge.target);
        const label = target?.name ?? edge.symbol ?? edge.target;
        return `- [[${label}]] (${edge.type}, ${edge.confidence})`;
      });
    const body = [PUDU_EXPORT_MARK, `# ${node.name}`, "", `Source: \`${node.file ?? node.id}\``, "", "## Links", ...(links.length ? links : ["- N/A"]), ""].join("\n");
    notes.push({ relativePath, body });
  }
  const index = [PUDU_EXPORT_MARK, "# Pudu graph", "", ...notes.map((note) => `- [[${path.posix.basename(note.relativePath, ".md")}]]`), ""].join("\n");
  notes.push({ relativePath: "pudu-ai-index.md", body: index });
  return { notes };
}

export function applyObsidianExport(plan: ExportPlan, existing: Record<string, string>, yes: boolean): ExportResult {
  const planned = plan.notes.map((note) => note.relativePath);
  if (!yes) return { wrote: false, planned, written: [], skipped: [] };
  const written: string[] = [];
  const skipped: string[] = [];
  for (const note of plan.notes) {
    const current = existing[note.relativePath];
    if (current !== undefined && !current.includes(PUDU_EXPORT_MARK)) {
      skipped.push(note.relativePath);
      continue;
    }
    written.push(note.relativePath);
  }
  return { wrote: written.length > 0, planned, written, skipped };
}

export async function commitObsidianExport(outDir: string, plan: ExportPlan, yes: boolean): Promise<ExportResult> {
  const existing: Record<string, string> = {};
  if (yes) {
    for (const note of plan.notes) {
      try {
        existing[note.relativePath] = await readFile(path.join(outDir, note.relativePath), "utf8");
      } catch {
        continue;
      }
    }
  }
  const result = applyObsidianExport(plan, existing, yes);
  if (!yes) return result;
  const bodies = new Map(plan.notes.map((note) => [note.relativePath, note.body]));
  for (const relativePath of result.written) {
    const target = path.join(outDir, relativePath);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, bodies.get(relativePath) ?? "", "utf8");
  }
  return result;
}
