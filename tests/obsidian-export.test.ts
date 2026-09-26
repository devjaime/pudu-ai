import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { applyObsidianExport, commitObsidianExport, planObsidianExport, PUDU_EXPORT_MARK } from "../src/agent-lab/obsidian-export.js";

const graph = {
  nodes: [
    { id: "a.md", name: "a", type: "note", file: "a.md" },
    { id: "b.md", name: "b", type: "note", file: "b.md" },
  ],
  edges: [{ source: "a.md", target: "b.md", type: "wikilink", confidence: "EXTRACTED", symbol: "b" }],
};

describe("obsidian export", () => {
  it("plans notes and writes nothing without --yes", () => {
    const plan = planObsidianExport(graph);
    const result = applyObsidianExport(plan, {}, false);
    expect(result.wrote).toBe(false);
    expect(result.written).toEqual([]);
    expect(result.planned).toContain("a.md");
    expect(result.planned).toContain("pudu-ai-index.md");
  });

  it("writes marked notes and does not clobber a hand-edited note", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "pudu-obs-"));
    const plan = planObsidianExport(graph);
    const first = await commitObsidianExport(dir, plan, true);
    expect(first.wrote).toBe(true);
    expect(await readFile(path.join(dir, "a.md"), "utf8")).toContain(PUDU_EXPORT_MARK);
    await writeFile(path.join(dir, "b.md"), "# hand edited\n");
    const second = await commitObsidianExport(dir, plan, true);
    expect(second.skipped).toContain("b.md");
    expect(await readFile(path.join(dir, "b.md"), "utf8")).toBe("# hand edited\n");
    expect(await readFile(path.join(dir, "a.md"), "utf8")).toContain(PUDU_EXPORT_MARK);
    await rm(dir, { recursive: true });
  });
});
