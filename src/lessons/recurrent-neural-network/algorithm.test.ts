import { describe, expect, it } from "vitest";
import { frameIndexOfTag } from "@/engine/types";
import { accuracyAtLength, forwardRnn, RNN_DEFAULTS, runRnn, validateText } from "./algorithm";
import fixtures from "./fixtures.json";

describe("rnn forward", () => {
  it("matches NumPy: every hidden state and the final probability", () => {
    const f = forwardRnn(fixtures.sample, 1);
    f.hidden.forEach((h, t) => h.forEach((v, j) => expect(v).toBeCloseTo(fixtures.hidden[t][j], 9)));
    expect(f.prob).toBeCloseTo(fixtures.prob, 9);
  });

  it("the trained network remembers the first letter even 40 letters later", () => {
    expect(accuracyAtLength(40, 1, 300)).toBeGreaterThanOrEqual(0.98);
  });

  it("break-it claim: with memory strength 0.3 short strings work, long ones become a coin toss", () => {
    expect(accuracyAtLength(4, 0.3, 300)).toBeGreaterThanOrEqual(0.95);
    expect(accuracyAtLength(20, 0.3, 300)).toBeLessThanOrEqual(0.65);
  });
});

describe("runRnn", () => {
  it("reads one letter per frame, then answers", () => {
    const t = runRnn("acdheg", RNN_DEFAULTS);
    expect(t.frames.map((f) => f.event)).toEqual(["init", "read", "read", "read", "read", "read", "read", "predict"]);
    for (const tag of ["start", "first-step", "step-3", "done"]) expect(frameIndexOfTag(t, tag), tag).toBeGreaterThanOrEqual(0);
    expect(t.frames[2].state.step).toBe(2);
  });

  it("records the accuracy-by-length chart for the current memory strength", () => {
    const t = runRnn("acd", { memory: 0.3 });
    const chart = t.frames[0].state.chart;
    expect(chart.map((c) => c.length)).toEqual([2, 4, 8, 15, 25, 40]);
    expect(chart[0].accuracy).toBeGreaterThan(chart.at(-1)!.accuracy);
  });

  it("answers 'started with a' for a and 'not a' for b", () => {
    expect(runRnn("acdef", RNN_DEFAULTS).frames.at(-1)!.metrics.prob).toBeGreaterThan(0.5);
    expect(runRnn("bcdef", RNN_DEFAULTS).frames.at(-1)!.metrics.prob).toBeLessThan(0.5);
  });
});

describe("validateText", () => {
  it.each([
    ["", "tooShort"],
    ["a", "tooShort"],
    ["acxz", "badLetters"],
    ["cdea", "badStart"],
    ["a".repeat(41), "tooLong"],
    ["bcdh", null],
  ])("%j → %s", (text, err) => {
    expect(validateText(text)).toBe(err);
  });
});

describe("review fix: the answer text is a percentage", () => {
  it("says '…: 0.1%.' rather than '…: 0.'", async () => {
    const { interpolate } = await import("@/engine/text");
    const content = (await import("../../../content/en/lessons/recurrent-neural-network.json")).default;
    const last = runRnn("bdcfhegdcehf", RNN_DEFAULTS).frames.at(-1)!;
    expect(interpolate(content.events.predict.body, last.metrics)).toMatch(/^Chance it started with a: \d+(\.\d)?%\.$/);
  });
});
