import { describe, expect, it } from "vitest";
import { t } from "../src/i18n/index.js";

describe("i18n English locale", () => {
  it("returns English strings", () => {
    expect(t("appTitle")).toBe("LOCALMETER AI");
    expect(t("doctorReady", { count: 2 })).toBe("Ready to benchmark 2 installed models.");
  });
});
