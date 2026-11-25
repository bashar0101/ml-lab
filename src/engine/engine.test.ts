import { describe, expect, it } from "vitest";
import { capFrames } from "./cap";
import { mulberry32 } from "./random";
import { interpolate } from "./text";
import { frameIndexOfTag, type Frame } from "./types";

const frame = (i: number, tags: string[]): Frame<number> => ({
  state: i,
  codeLine: "x",
  event: "e",
  metrics: {},
  tags,
});

describe("mulberry32", () => {
  it("is deterministic per seed and in [0, 1)", () => {
    const a = mulberry32(7);
    const b = mulberry32(7);
    const xs = [a(), a(), a()];
    expect(xs).toEqual([b(), b(), b()]);
    expect(mulberry32(8)()).not.toBe(mulberry32(7)());
    for (const x of xs) expect(x >= 0 && x < 1).toBe(true);
  });
});

describe("capFrames", () => {
  it("keeps first, last and tagged frames in order", () => {
    const f = Array.from({ length: 5000 }, (_, i) => frame(i, i === 1234 ? ["x"] : []));
    const { frames, truncated } = capFrames(f, 2000);
    expect(truncated).toBe(true);
    expect(frames.length).toBeLessThanOrEqual(2000);
    expect(frames.length).toBeGreaterThan(1900);
    expect(frames[0].state).toBe(0);
    expect(frames.at(-1)!.state).toBe(4999);
    expect(frames.some((x) => x.state === 1234)).toBe(true);
    const order = frames.map((x) => x.state);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it("is a no-op under the cap", () => {
    expect(capFrames([frame(0, []), frame(1, [])], 10)).toEqual({
      frames: [frame(0, []), frame(1, [])],
      truncated: false,
    });
  });

  it("keeps every tagged frame even when they exceed the cap", () => {
    const f = Array.from({ length: 50 }, (_, i) => frame(i, ["t"]));
    expect(capFrames(f, 10).frames).toHaveLength(50);
  });
});

describe("frameIndexOfTag", () => {
  it("finds the first frame with a tag, or -1", () => {
    const trace = { frames: [frame(0, []), frame(1, ["a"]), frame(2, ["a"])], meta: { algorithm: "t", seed: 1, truncated: false } };
    expect(frameIndexOfTag(trace, "a")).toBe(1);
    expect(frameIndexOfTag(trace, "zzz")).toBe(-1);
  });
});

describe("interpolate", () => {
  it("fills, formats and leaves unknown keys", () => {
    expect(interpolate("Loss {loss} at {step}", { loss: 3.14159, step: 4 })).toBe("Loss 3.14 at 4");
    expect(interpolate("{nope}", {})).toBe("{nope}");
    expect(interpolate("{a}", { a: 1 }, (k, v) => `${k}=${v * 2}`)).toBe("a=2");
  });
});
