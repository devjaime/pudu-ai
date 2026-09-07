import { describe, expect, it } from "vitest";
import { fit } from "../src/tui/width.js";

describe("terminal fit", () => {
  it("does not exceed width", () => {
    expect(fit("hello", 10)).toBe("hello");
    expect(fit("hello-world-overflow", 8).length).toBe(8);
    expect(fit("hello-world-overflow", 8).endsWith("…")).toBe(true);
  });
});
