import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { compatibilityResponseSchema } from "../src/adapters/canirun/schema.js";

describe("CanIRun schema", () => {
  it("parses compatibility payload", () => {
    const json = JSON.parse(
      readFileSync(
        path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "canirun-compatibility.json"),
        "utf8",
      ),
    );
    const parsed = compatibilityResponseSchema.parse(json);
    expect(parsed.grade).toBe("A");
    expect(parsed.estimated?.tokensPerSecond).toBe(42);
  });
});
