import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { setLocale } from "../src/i18n/index.js";
import { decideAntigravity, writeAntigravityConfig } from "../src/integrations/antigravity.js";
import { GiB } from "../src/shared/bytes.js";

const base = {
  ollamaDetected: true,
  unifiedMemoryBytes: 16 * GiB,
  antigravityDetected: false,
  candidates: [] as [],
};

describe("antigravity eligibility", () => {
  it("accepts a fitting local tag on loopback and never emits ollama launch", () => {
    setLocale("en");
    const decision = decideAntigravity({ ...base, requestedTag: "gemma4:e4b" });
    expect(decision.eligible).toBe(true);
    expect(decision.command).toBeNull();
    expect(decision.config?.baseUrl).toBe("http://127.0.0.1:11434/v1");
    expect(decision.config?.model).toBe("gemma4:e4b");
    expect(decision.host).toBe("openai-compatible-local");
  });

  it("blocks cloud tags, missing ollama, grade F, and non-loopback URLs", () => {
    expect(decideAntigravity({ ...base, requestedTag: "gemma4:cloud" }).eligible).toBe(false);
    expect(decideAntigravity({ ...base, requestedTag: "gemma4:31b-cloud" }).tagClass).toBe("cloud");
    expect(decideAntigravity({ ...base, ollamaDetected: false, requestedTag: "gemma4:e4b" }).eligible).toBe(false);
    expect(decideAntigravity({ ...base, requestedTag: "gemma4:26b" }).eligible).toBe(false);
    expect(decideAntigravity({ ...base, requestedTag: "gemma4:e4b", baseUrl: "http://example.com/v1" }).eligible).toBe(false);
  });

  it("blocks measured speed under the agent floor and keeps LiteRT detect-only", () => {
    const slow = decideAntigravity({
      ...base,
      requestedTag: "gemma4:e2b",
      candidates: [{ tag: "gemma4:e2b", installed: true, origin: "measured", tps: 4 }],
    });
    expect(slow.eligible).toBe(false);
    expect(slow.speedTps).toBe(4);
    const litert = decideAntigravity({ ...base, requestedTag: "/tmp/gemma.litertlm" });
    expect(litert.host).toBe("detect-only");
    expect(litert.eligible).toBe(false);
    expect(litert.config).toBeNull();
  });

  it("writes a config only through the explicit writer", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "pudu-agy-"));
    const decision = decideAntigravity({ ...base, requestedTag: "gemma4:e4b" });
    const file = await writeAntigravityConfig(path.join(dir, "antigravity.local.json"), decision.config!);
    const written = JSON.parse(await readFile(file, "utf8")) as { model: string; host: string };
    expect(written.host).toBe("openai-compatible-local");
    expect(written.model).toBe("gemma4:e4b");
    await rm(dir, { recursive: true });
  });
});
