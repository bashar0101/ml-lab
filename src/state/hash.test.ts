import { describe, expect, it } from "vitest";
import { BY_HAND_HASH, formatHash, isByHandHash, parseHash } from "./hash";

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

  it("opens the Lab on the paper example for #lab-by-hand", () => {
    expect(parseHash(BY_HAND_HASH, 6)).toEqual({ mode: "lab", step: 0 });
    expect(isByHandHash("#lab-by-hand")).toBe(true);
    expect(isByHandHash("#LAB-BY-HAND")).toBe(true);
    expect(isByHandHash("#lab")).toBe(false);
    expect(isByHandHash("")).toBe(false);
  });

  it("round-trips with formatHash", () => {
    expect(parseHash(formatHash("learn", 3), 6)).toEqual({ mode: "learn", step: 3 });
    expect(formatHash("learn", 0)).toBe("");
    expect(formatHash("lab", 2)).toBe("#lab");
  });
});
