import { describe, expect, it } from "vitest";
import { formatHash, parseHash } from "./hash";

describe("parseHash", () => {
  it.each([
    ["", "learn", 0],
    ["#step-4", "learn", 3],
    ["#step-99", "learn", 5],
    ["#step-0", "learn", 0],
    ["#step-abc", "learn", 0],
    ["#lab", "lab", 0],
    ["#LAB", "lab", 0],
    ["#whatever", "learn", 0],
  ])("parseHash(%s)", (h, mode, step) => {
    expect(parseHash(h, 6)).toEqual({ mode, step });
  });

  it("round-trips with formatHash", () => {
    expect(parseHash(formatHash("learn", 3), 6)).toEqual({ mode: "learn", step: 3 });
    expect(formatHash("learn", 0)).toBe("");
    expect(formatHash("lab", 2)).toBe("#lab");
  });
});
