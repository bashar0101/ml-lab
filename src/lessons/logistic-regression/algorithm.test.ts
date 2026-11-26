import { describe, expect, it } from "vitest";
import { frameIndexOfTag } from "@/engine/types";
import { makeDataset, type LabeledPoint } from "../shared/datasets2d";
import { boundaryLine, LOG_DEFAULTS, probability, runLogistic, validateLogistic } from "./algorithm";
import fixtures from "./fixtures.json";

const pts: LabeledPoint[] = fixtures.points.map(([x, y, c]) => ({ x, y, c: c as 0 | 1 }));

describe("runLogistic", () => {
  it("matches NumPy after 1, 10 and 60 steps", () => {
    const t = runLogistic(pts, LOG_DEFAULTS);
    for (const step of ["1", "10", "60"] as const) {
      const fx = fixtures.steps[step];
      const f = t.frames.find((q) => q.codeLine === "update" && q.state.step === Number(step))!;
      expect(f.state.w[0]).toBeCloseTo(fx.w[0], 9);
      expect(f.state.w[1]).toBeCloseTo(fx.w[1], 9);
      expect(f.state.b).toBeCloseTo(fx.b, 9);
      expect(f.metrics.loss).toBeCloseTo(fx.loss, 9);
    }
  });

  it("records init, predict/error/update per step and done, with the story tags", () => {
    const t = runLogistic(pts, LOG_DEFAULTS);
    expect(t.frames).toHaveLength(1 + 3 * 60 + 1);
    expect(t.frames[0]).toMatchObject({ event: "init", codeLine: "init", tags: ["start"] });
    expect(t.frames.slice(1, 4).map((f) => f.codeLine)).toEqual(["predict", "error", "update"]);
    for (const tag of ["first-update", "update-10", "done"]) expect(frameIndexOfTag(t, tag), tag).toBeGreaterThan(0);
  });

  it("accuracy uses the threshold, and the threshold doesn't change the training", () => {
    const a = runLogistic(pts, LOG_DEFAULTS);
    const b = runLogistic(pts, { ...LOG_DEFAULTS, threshold: 0.95 });
    expect(b.frames.at(-1)!.state.w).toEqual(a.frames.at(-1)!.state.w);
    expect(a.frames.at(-1)!.metrics.accuracy).toBeGreaterThan(b.frames.at(-1)!.metrics.accuracy);
  });

  it("loss stays finite when probabilities hit 0 or 1 (separable data, big learning rate)", () => {
    const t = runLogistic(makeDataset("blobs"), { ...LOG_DEFAULTS, learningRate: 5, steps: 200 });
    for (const f of t.frames) expect(Number.isFinite(f.metrics.loss)).toBe(true);
    expect(t.frames.at(-1)!.metrics.accuracy).toBe(1);
  });

  it("no straight line fits circles: accuracy stays near a coin flip", () => {
    const t = runLogistic(makeDataset("circles"), LOG_DEFAULTS);
    expect(t.frames.at(-1)!.metrics.accuracy).toBeLessThan(0.75);
  });

  it("the boundary line is where the probability equals the threshold", () => {
    const t = runLogistic(pts, LOG_DEFAULTS);
    const s = t.frames.at(-1)!.state;
    const line = boundaryLine(s, 0.7);
    expect(line.kind).toBe("line");
    if (line.kind === "line") {
      const x = 5;
      expect(probability(s, x, line.slope * x + line.intercept)).toBeCloseTo(0.7, 9);
    }
    expect(boundaryLine({ ...s, w: [0, 0] }, 0.5).kind).toBe("none");
  });
});

describe("validateLogistic", () => {
  it.each([
    [[], "tooFew"],
    [pts.slice(0, 3), "tooFew"],
    [pts.filter((p) => p.c === 0), "oneClass"],
    [pts, null],
  ])("case %#", (data, err) => {
    expect(validateLogistic(data as LabeledPoint[])).toBe(err);
  });

  it("a single column of x still trains (one feature has zero spread)", () => {
    const col: LabeledPoint[] = [1, 2, 3, 4, 5, 6].map((y, i) => ({ x: 4, y, c: (i < 3 ? 0 : 1) as 0 | 1 }));
    const t = runLogistic(col, LOG_DEFAULTS);
    for (const f of t.frames) expect(Number.isFinite(f.metrics.loss)).toBe(true);
  });
});
