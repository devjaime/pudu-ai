import { describe, expect, it } from "vitest";
import { handleAppKey } from "../src/tui/keys.js";

describe("TUI key handler", () => {
  it("does not throw on tasks/setup before reading letter", () => {
    expect(() => handleAppKey("tasks", "q", {})).not.toThrow();
    expect(() => handleAppKey("setup", "i", {})).not.toThrow();
    expect(handleAppKey("tasks", "q", {})).toEqual({ type: "quit" });
    expect(handleAppKey("tasks", "", { escape: true })).toEqual({ type: "home" });
    expect(handleAppKey("tasks", "x", {})).toEqual({ type: "ignore" });
  });

  it("opens tasks from home with t", () => {
    expect(handleAppKey("home", "t", {})).toEqual({ type: "screen", screen: "tasks" });
  });

  it("R shows recommendations, S opens setup", () => {
    expect(handleAppKey("home", "r", {})).toEqual({ type: "screen", screen: "recommend" });
    expect(handleAppKey("home", "s", {})).toEqual({ type: "screen", screen: "setup" });
    expect(handleAppKey("home", "i", {})).toEqual({ type: "screen", screen: "setup" });
  });

  it("ignores letters while benchmarking", () => {
    expect(handleAppKey("benchmark", "q", {})).toEqual({ type: "ignore" });
  });

  it("keeps S and B working from setup, I stays local", () => {
    expect(handleAppKey("setup", "b", {})).toEqual({ type: "screen", screen: "benchmark" });
    expect(handleAppKey("setup", "s", {})).toEqual({ type: "screen", screen: "setup" });
    expect(handleAppKey("setup", "r", {})).toEqual({ type: "screen", screen: "recommend" });
    expect(handleAppKey("setup", "i", {})).toEqual({ type: "ignore" });
    expect(handleAppKey("tasks", "b", {})).toEqual({ type: "screen", screen: "benchmark" });
  });
});
