import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildVaultGraph, loadVaultFiles } from "../src/agent-lab/vault-graph.js";

describe("vault graph", () => {
  it("extracts one wikilink and counts a dangling link without inventing an edge", () => {
    const graph = buildVaultGraph(
      "/vault",
      [
        { relativePath: "a.md", text: "# A\nSee [[b]] and [[missing]].\n" },
        { relativePath: "b.md", text: "# B\n" },
        { relativePath: "c.md", text: "# C\n" },
        { relativePath: "../secret.md", text: "[[b]]\n" },
      ],
      ["a.md", "b.md", "c.md"],
    );
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0]).toMatchObject({ source: "a.md", target: "b.md", confidence: "EXTRACTED", type: "wikilink" });
    expect(graph.unresolved).toEqual([{ source: "a.md", target: "missing", line: 2 }]);
    expect(graph.edges.every((edge) => edge.confidence === "EXTRACTED")).toBe(true);
    expect(graph.nodes.some((node) => node.file === "../secret.md")).toBe(false);
  });

  it("does not walk outside the vault root", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "pudu-vault-"));
    const outside = await mkdtemp(path.join(tmpdir(), "pudu-outside-"));
    await writeFile(path.join(root, "a.md"), "[[b]]\n");
    await writeFile(path.join(root, "b.md"), "ok\n");
    await mkdir(path.join(root, ".obsidian"));
    await writeFile(path.join(root, ".obsidian", "secret.md"), "[[b]]\n");
    await writeFile(path.join(outside, "secret.md"), "[[b]]\n");
    const loaded = await loadVaultFiles(root);
    expect(loaded.files.map((file) => file.relativePath).sort()).toEqual(["a.md", "b.md"]);
    await rm(root, { recursive: true });
    await rm(outside, { recursive: true });
  });
});
