import { describe, expect, it } from "vitest";
import { getLocale, resolveLocale, setLocale, t } from "../src/i18n/index.js";

describe("i18n", () => {
  it("defaults to English", () => {
    setLocale("en");
    expect(t("appTitle")).toBe("PUDU-AI");
    expect(t("doctorReady", { count: 2 })).toBe("Ready to benchmark 2 installed models.");
    expect(t("credits")).toContain("midudev");
    expect(t("credits")).toContain("CanIRun.ai");
  });

  it("switches to Spanish", () => {
    setLocale("es");
    expect(t("doctorTitle")).toBe("Pudu-AI Doctor");
    expect(t("doctorReady", { count: 2 })).toBe("Listo para medir 2 modelos instalados.");
    expect(t("selectBenchmark")).toBe("Selecciona un modelo para medir");
    expect(t("credits")).toContain("midudev");
    setLocale("en");
    expect(getLocale()).toBe("en");
  });

  it("resolves locale from LANG-like values", () => {
    expect(resolveLocale("es")).toBe("es");
    expect(resolveLocale("es_CL.UTF-8")).toBe("es");
    expect(resolveLocale("en-US")).toBe("en");
    expect(resolveLocale("fr")).toBe("en");
  });
});
