import { describe, expect, it } from "vitest";
import { parseArgs } from "../src/cli/parse-args.js";

describe("parseArgs repo search", () => {
  it("parses repo search query and flags", () => {
    const args = parseArgs([
      "node",
      "pudu-ai",
      "repo",
      "search",
      "validate_user",
      "--repo",
      ".",
      "--json",
      "--limit",
      "20",
      "--glob",
      "*.py",
      "--intent",
      "TEXT",
    ]);
    expect(args.command).toBe("repo");
    expect(args.positional).toEqual(["search", "validate_user"]);
    expect(args.repo).toBe(".");
    expect(args.json).toBe(true);
    expect(args.limit).toBe(20);
    expect(args.globs).toEqual(["*.py"]);
    expect(args.intent).toBe("TEXT");
  });

  it("parses structural search without treating the pattern as the command", () => {
    const args = parseArgs([
      "node",
      "pudu-ai",
      "repo",
      "search",
      "--structural",
      "def $FUNC($$$ARGS): $$$BODY",
    ]);
    expect(args.command).toBe("repo");
    expect(args.positional).toEqual(["search"]);
    expect(args.structural).toBe("def $FUNC($$$ARGS): $$$BODY");
  });

  it("still parses benchmark --preset without eating the model id", () => {
    const args = parseArgs(["node", "pudu-ai", "benchmark", "qwen3:8b", "--preset", "quick", "--json"]);
    expect(args.command).toBe("benchmark");
    expect(args.positional).toEqual(["qwen3:8b"]);
    expect(args.preset).toBe("quick");
    expect(args.json).toBe(true);
  });
});
