import { describe, expect, it } from "vitest";
import { frameIndexOfTag } from "@/engine/types";
import { LR_DEFAULTS, lrLoss, runLinearRegression, toLine, validateData, type Point } from "./algorithm";
import fixtures from "./fixtures.json";
import { PRESETS } from "./presets";
import { buildSurface, surfaceRanges, type SurfacePolygon } from "./surface";

type FixtureId = keyof typeof fixtures;

describe("runLinearRegression", () => {
  it.each(PRESETS.map((p) => [p.id, p] as const))("matches NumPy on %s", (id, preset) => {
    const fx = fixtures[id as FixtureId];
    const t = runLinearRegression(preset.points, LR_DEFAULTS);
    const at = (tag: string) => t.frames[frameIndexOfTag(t, tag)].state;
    expect(at("first-update").w).toBeCloseTo(fx.step1.w, 9);
    expect(at("first-update").b).toBeCloseTo(fx.step1.b, 9);
    expect(at("update-8").w).toBeCloseTo(fx.step8.w, 9);
    expect(at("update-8").b).toBeCloseTo(fx.step8.b, 9);
    const last = t.frames.at(-1)!.state;
    expect(last.w).toBeCloseTo(fx.final.w, 9);
    // Prices in the hundreds take longer at the default rate: after 40 steps the car-prices line is
    // within 0.01 of least squares. The paper example runs it at rate 0.3 and lands exactly
    // (checked in byHandLab.test.ts).
    expect(toLine(last).slope).toBeCloseTo(fx.lstsq.slope, id === "car-prices" ? 1 : 2);
  });

  it("emits 1 + 3*steps + 1 frames with the right code lines", () => {
    const t = runLinearRegression(PRESETS[0].points, LR_DEFAULTS);
    expect(t.frames).toHaveLength(122);
    expect(t.frames[0]).toMatchObject({ event: "init", codeLine: "init", tags: ["start"] });
    expect(t.frames.slice(1, 4).map((f) => f.codeLine)).toEqual(["predict", "error", "update"]);
    expect(t.frames.at(-1)).toMatchObject({ event: "done", codeLine: "return", tags: ["done"] });
    expect(t.meta).toMatchObject({ algorithm: "linear-regression", truncated: false });
  });

  it("records loss, iteration, slope and intercept on every frame", () => {
    const t = runLinearRegression(PRESETS[0].points, LR_DEFAULTS);
    for (const f of t.frames) expect(Object.keys(f.metrics).sort()).toEqual(["intercept", "iteration", "loss", "slope"]);
    expect(t.frames[3].metrics.iteration).toBe(1);
    // the guess and measure frames of the first step already belong to step 1
    expect(t.frames[1].metrics.iteration).toBe(1);
    expect(t.frames[2].metrics.iteration).toBe(1);
    expect(t.frames[0].metrics.loss).toBeCloseTo(lrLoss(PRESETS[0].points, -10, 20, 5, Math.sqrt(60 / 9)), 9);
  });

  it("stops with a diverged frame instead of producing NaN", () => {
    const t = runLinearRegression(PRESETS[0].points, { ...LR_DEFAULTS, learningRate: 50, steps: 200 });
    const last = t.frames.at(-1)!;
    expect(last.event).toBe("diverged");
    expect(last.tags).toContain("done");
    expect(t.frames.length).toBeLessThan(1 + 3 * 200);
    for (const f of t.frames.slice(0, -1)) expect(Number.isFinite(f.metrics.loss)).toBe(true);
  });

  it("lr 1.2 overshoots: the loss rises and an overshoot event appears", () => {
    const t = runLinearRegression(PRESETS[0].points, { ...LR_DEFAULTS, learningRate: 1.2 });
    expect(t.frames.some((f) => f.event === "overshoot")).toBe(true);
  });

  it("throws on invalid data", () => {
    expect(() => runLinearRegression([{ x: 1, y: 1 }], LR_DEFAULTS)).toThrow(/tooFew/);
  });
});

describe("validateData", () => {
  it.each([
    [[], "tooFew"],
    [[{ x: 1, y: 2 }], "tooFew"],
    [[{ x: 3, y: 1 }, { x: 3, y: 9 }], "sameX"],
    [[{ x: 0.7, y: 20 }, { x: 0.7, y: 50 }, { x: 0.7, y: 80 }], "sameX"],
    [[{ x: 0.3, y: 1 }, { x: 0.3, y: 2 }, { x: 0.3, y: 3 }, { x: 0.3, y: 4 }, { x: 0.3, y: 5 }, { x: 0.3, y: 6 }], "sameX"],
    [[{ x: 1, y: 1 }, { x: 2, y: 2 }], null],
  ])("validateData(%j) = %s", (pts, err) => {
    expect(validateData(pts as Point[])).toBe(err);
  });
});

describe("surface", () => {
  it("buildSurface returns n*n polygons ordered back to front", () => {
    const polys = buildSurface((w, b) => w * w + b * b, [-1, 1], [-1, 1], 14);
    expect(polys).toHaveLength(196);
    const depth = (p: SurfacePolygon) => Math.max(...p.points.map((q) => q[1]));
    expect(depth(polys[0])).toBeLessThanOrEqual(depth(polys.at(-1)!) + 1e-9);
    for (const p of polys) {
      expect(p.height).toBeGreaterThanOrEqual(0);
      expect(p.height).toBeLessThanOrEqual(1);
    }
  });

  it("surfaceRanges contains the optimum and the start, ignoring diverged frames", () => {
    const pts = PRESETS[0].points;
    const t = runLinearRegression(pts, { ...LR_DEFAULTS, learningRate: 50, steps: 200 });
    const { wRange, bRange } = surfaceRanges(pts, t);
    const best = runLinearRegression(pts, LR_DEFAULTS).frames.at(-1)!.state;
    for (const [lo, hi, v] of [
      [wRange[0], wRange[1], best.w],
      [bRange[0], bRange[1], best.b],
      [wRange[0], wRange[1], -10],
      [bRange[0], bRange[1], 20],
    ])
      expect(v > lo && v < hi).toBe(true);
    expect(Number.isFinite(wRange[1] - wRange[0])).toBe(true);
    expect(wRange[1] - wRange[0]).toBeLessThan(200);
  });
});
