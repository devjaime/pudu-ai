import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  parseAppleSiliconChip,
  parseMacosMemoryPressure,
  parseMacosSwapUsage,
  parseMacosVmStat,
} from "../src/platform/macos/hardware.js";

describe("macos hardware parsing", () => {
  it("parses Apple silicon names", () => {
    expect(parseAppleSiliconChip("Apple M4")).toEqual({ generation: "M4", variant: "base" });
    expect(parseAppleSiliconChip("Apple M5 Pro")).toEqual({ generation: "M5", variant: "Pro" });
    expect(parseAppleSiliconChip("Apple M3 Max")).toEqual({ generation: "M3", variant: "Max" });
  });

  it("parses vm_stat", () => {
    const text = readFileSync(
      path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "vm_stat.txt"),
      "utf8",
    );
    const parsed = parseMacosVmStat(text, 16384);
    expect(parsed.availableBytes).toBeGreaterThan(0);
  });

  it("parses memory pressure", () => {
    expect(parseMacosMemoryPressure("System-wide memory free percentage: 80")).toBe("Nominal");
    expect(parseMacosMemoryPressure("System-wide memory free percentage: 10")).toBe("Critical");
  });

  it("parses vm.swapusage", () => {
    const used = parseMacosSwapUsage("total = 2048.00M  used = 398.50M  free = 1649.50M  (encrypted)");
    expect(used).toBeCloseTo(398.5 * 1024 ** 2);
  });
});
