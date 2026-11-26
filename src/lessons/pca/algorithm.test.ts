import { describe, expect, it } from "vitest";
import { frameIndexOfTag } from "@/engine/types";
import { makeDataset, type LabeledPoint } from "../shared/datasets2d";
import { analyse, PCA_DEFAULTS, runPca, validatePca, varianceAlong } from "./algorithm";
import fixtures from "./fixtures.json";

const pts: LabeledPoint[] = fixtures.points.map(([x, y]) => ({ x, y, c: 0 }));

describe("analyse", () => {
  it("matches numpy: mean, covariance, eigenvalues and the first component's angle", () => {
    const a = analyse(pts);
    expect(a.mean[0]).toBeCloseTo(fixtures.mean[0], 12);
    expect(a.mean[1]).toBeCloseTo(fixtures.mean[1], 12);
    a.cov.forEach((v, i) => expect(v).toBeCloseTo(fixtures.cov[i], 12));
    expect(a.lambda1).toBeCloseTo(fixtures.lambda1, 10);
    expect(a.lambda2).toBeCloseTo(fixtures.lambda2, 10);
    expect(a.pc1Angle).toBeCloseTo(fixtures.pc1Angle, 8);
  });

  it("variance along a direction matches numpy", () => {
    const a = analyse(pts);
    for (const [deg, v] of Object.entries(fixtures.along)) expect(varianceAlong(a.cov, Number(deg))).toBeCloseTo(v, 12);
  });

  it("degenerate data stays finite: identical points and points on a line", () => {
    const same = analyse([{ x: 3, y: 3, c: 0 }, { x: 3, y: 3, c: 0 }]);
    expect(Number.isFinite(same.pc1Angle)).toBe(true);
    expect(same.lambda1).toBe(0);
    const line = analyse([0, 1, 2, 3].map((v) => ({ x: v, y: 2 * v, c: 0 as const })));
    expect(line.lambda2).toBeCloseTo(0, 12);
    expect(line.pc1Angle).toBeCloseTo((Math.atan2(2, 1) * 180) / Math.PI, 9);
  });
});

describe("runPca", () => {
  it("walks raw → centre → a sweep of directions → PC1 → PC2 → project → done", () => {
    const t = runPca(pts, PCA_DEFAULTS);
    const events = t.frames.map((f) => f.event);
    expect(events[0]).toBe("init");
    expect(events[1]).toBe("center");
    expect(events.filter((e) => e === "sweep")).toHaveLength(31);
    expect(events.slice(-4)).toEqual(["pc1", "pc2", "project", "done"]);
    for (const tag of ["start", "center", "sweep", "pc1", "pc2", "project", "done"]) expect(frameIndexOfTag(t, tag), tag).toBeGreaterThanOrEqual(0);
  });

  it("the sweep's biggest variance is the first component (within the 6° step)", () => {
    const t = runPca(pts, PCA_DEFAULTS);
    const sweep = t.frames.filter((f) => f.event === "sweep");
    const best = sweep.reduce((a, f) => (f.metrics.variance > a.metrics.variance ? f : a));
    const diff = Math.abs(best.state.angle - fixtures.pc1Angle);
    expect(Math.min(diff, 180 - diff)).toBeLessThanOrEqual(3);
  });

  it("explained variance: PC1's share with one component, all of it with two", () => {
    const one = runPca(pts, { components: 1 }).frames.at(-1)!;
    expect(one.metrics.explained).toBeCloseTo(fixtures.lambda1 / (fixtures.lambda1 + fixtures.lambda2), 10);
    expect(runPca(pts, { components: 2 }).frames.at(-1)!.metrics.explained).toBe(1);
  });

  it("round data: no direction stands out", () => {
    const t = runPca(makeDataset("round"), PCA_DEFAULTS);
    expect(t.frames.at(-1)!.metrics.explained).toBeLessThan(0.65);
  });

  it("stripes: PC1 runs along the stripes, not across them", () => {
    const a = analyse(makeDataset("stripes"));
    const along = Math.abs(((a.pc1Angle + 90) % 180) - 90);
    expect(along).toBeLessThan(20);
  });
});

describe("validatePca", () => {
  it("needs two points", () => {
    expect(validatePca(pts.slice(0, 1))).toBe("tooFew");
    expect(validatePca(pts)).toBeNull();
  });
});
