import { describe, expect, it } from "vitest";
import { handleAppKey } from "../src/tui/keys.js";

describe("TUI key handler", () => {
  it("does not throw on tasks/recommend before reading letter", () => {
    expect(() => handleAppKey("tasks", "q", {})).not.toThrow();
    expect(() => handleAppKey("recommend", "i", {})).not.toThrow();
    expect(handleAppKey("tasks", "q", {})).toEqual({ type: "quit" });
    expect(handleAppKey("tasks", "", { escape: true })).toEqual({ type: "home" });
    expect(handleAppKey("tasks", "x", {})).toEqual({ type: "ignore" });
  });

  it("opens tasks from home with t", () => {
    expect(handleAppKey("home", "t", {})).toEqual({ type: "screen", screen: "tasks" });
  });

  it("opens setup/install from home with s or i", () => {
    expect(handleAppKey("home", "s", {})).toEqual({ type: "screen", screen: "recommend" });
    expect(handleAppKey("home", "i", {})).toEqual({ type: "screen", screen: "recommend" });
  });

  it("ignores letters while benchmarking", () => {
    expect(handleAppKey("benchmark", "q", {})).toEqual({ type: "ignore" });
  });

  it("keeps S and B working from the setup screen", () => {
    expect(handleAppKey("recommend", "b", {})).toEqual({ type: "screen", screen: "benchmark" });
    expect(handleAppKey("recommend", "s", {})).toEqual({ type: "screen", screen: "recommend" });
    expect(handleAppKey("recommend", "i", {})).toEqual({ type: "ignore" });
    expect(handleAppKey("tasks", "b", {})).toEqual({ type: "screen", screen: "benchmark" });
  });
});
