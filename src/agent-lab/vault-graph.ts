import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import type { GraphEdge, GraphNode } from "./types.js";

const SKIP_DIRS = new Set([".git", ".obsidian", "node_modules", ".venv", "venv", "dist", "build", ".pudu-ai"]);
const MAX_FILES = 500;
const MAX_BYTES = 400_000;

export type VaultFile = { relativePath: string; text: string };

export type VaultGraph = {
  schemaVersion: 1;
  ok: boolean;
  op: "vault-graph";
  repo: string;
  backend: "markdown-wikilink";
  nodes: GraphNode[];
  edges: GraphEdge[];
  unresolved: Array<{ source: string; target: string; line: number }>;
  metrics: {
    fileCount: number;
    nodeCount: number;
    edgeCount: number;
    unresolvedCount: number;
    durationMs: number;
    origin: "MEASURED";
  };
  errors: Array<{ tool: string; message: string; origin: "MEASURED" }>;
};

function insideRoot(relativePath: string): boolean {
  if (!relativePath || relativePath.includes("\0")) return false;
  const norm = path.posix.normalize(relativePath.replaceAll("\\", "/"));
  if (path.posix.isAbsolute(norm) || norm.startsWith("../") || norm === "..") return false;
  return !norm.split("/").some((part) => part === ".." || part === ".obsidian");
}

function resolveTarget(raw: string, present: Set<string>): string | undefined {
  const cleaned = raw.trim().replaceAll("\\", "/");
  if (!cleaned || !insideRoot(cleaned)) return undefined;
  const candidates = cleaned.toLowerCase().endsWith(".md") ? [cleaned] : [cleaned, `${cleaned}.md`];
  for (const candidate of candidates) {
    if (present.has(candidate)) return candidate;
  }
  const base = path.posix.basename(cleaned).replace(/\.md$/i, "");
  const matches = [...present].filter((file) => {
    const name = path.posix.basename(file).replace(/\.md$/i, "");
    return name === base;
  });
  return matches.length === 1 ? matches[0] : undefined;
}

export function buildVaultGraph(root: string, files: VaultFile[], presentPaths: string[]): VaultGraph {
  const started = Date.now();
  const present = new Set(presentPaths.filter(insideRoot));
  const notes = files.filter((file) => insideRoot(file.relativePath) && file.relativePath.toLowerCase().endsWith(".md"));
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const unresolved: VaultGraph["unresolved"] = [];
  const seen = new Set<string>();

  for (const file of notes) {
    const id = file.relativePath;
    nodes.push({ id, type: "note", name: path.posix.basename(id, ".md"), file: id, line: 1, backend: "markdown-wikilink" });
    const lines = file.text.split(/\r?\n/);
    lines.forEach((line, index) => {
      const heading = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
      if (heading) {
        const headingId = `${id}#${heading[2]}`;
        if (!seen.has(headingId)) {
          seen.add(headingId);
          nodes.push({
            id: headingId,
            type: "heading",
            name: heading[2] ?? "",
            file: id,
            line: index + 1,
            backend: "markdown-wikilink",
          });
        }
      }
      const linkRe = /!?\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g;
      for (const match of line.matchAll(linkRe)) {
        const targetRaw = match[1] ?? "";
        const attachment = match[0].startsWith("!");
        const resolved = resolveTarget(targetRaw, present);
        if (!resolved) {
          unresolved.push({ source: id, target: targetRaw.trim(), line: index + 1 });
          continue;
        }
        const type = attachment || !resolved.toLowerCase().endsWith(".md") ? "attachment" : "wikilink";
        edges.push({
          source: id,
          target: resolved,
          type,
          confidence: "EXTRACTED",
          file: id,
          line: index + 1,
          symbol: targetRaw.trim(),
          backend: "markdown-wikilink",
        });
      }
    });
  }

  return {
    schemaVersion: 1,
    ok: true,
    op: "vault-graph",
    repo: root,
    backend: "markdown-wikilink",
    nodes,
    edges,
    unresolved,
    metrics: {
      fileCount: notes.length,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      unresolvedCount: unresolved.length,
      durationMs: Date.now() - started,
      origin: "MEASURED",
    },
    errors: [],
  };
}

export async function loadVaultFiles(root: string): Promise<{ root: string; files: VaultFile[]; present: string[] }> {
  const resolved = path.resolve(root);
  const files: VaultFile[] = [];
  const present: string[] = [];

  async function walk(dir: string): Promise<void> {
    if (files.length >= MAX_FILES) return;
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (files.length >= MAX_FILES) return;
      if (SKIP_DIRS.has(entry.name)) continue;
      const abs = path.join(dir, entry.name);
      const rel = path.relative(resolved, abs).split(path.sep).join("/");
      if (!insideRoot(rel) || rel.startsWith("..")) continue;
      if (entry.isDirectory()) {
        await walk(abs);
        continue;
      }
      if (!entry.isFile()) continue;
      present.push(rel);
      if (!rel.toLowerCase().endsWith(".md")) continue;
      const info = await stat(abs);
      if (info.size > MAX_BYTES) continue;
      files.push({ relativePath: rel, text: await readFile(abs, "utf8") });
    }
  }

  await walk(resolved);
  return { root: resolved, files, present };
}
