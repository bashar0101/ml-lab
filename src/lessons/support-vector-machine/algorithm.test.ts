import { describe, expect, it } from "vitest";
import { frameIndexOfTag } from "@/engine/types";
import { makeDataset, type LabeledPoint } from "../shared/datasets2d";
import { decision, linearWeights, runSvm, SVM_DEFAULTS, validateSvm } from "./algorithm";
import fixtures from "./fixtures.json";

const toPts = (raw: number[][]): LabeledPoint[] => raw.map(([x, y, c]) => ({ x, y, c: c as 0 | 1 }));
const accuracyOf = (points: LabeledPoint[], kernel: "linear" | "rbf", C: number, gamma = 0.5) =>
  runSvm(points, { ...SVM_DEFAULTS, kernel, C, gamma }).frames.at(-1)!.metrics.accuracy;

describe("runSvm", () => {
  it.each([
    ["linear", fixtures.linear, { kernel: "linear" as const, C: 1, gamma: 0.5 }],
    ["rbf", fixtures.rbf, { kernel: "rbf" as const, C: 10, gamma: 0.5 }],
  ])("matches NumPy kernel Pegasos (%s) after epochs 1, 5, 20", (_n, fx, p) => {
    const t = runSvm(toPts(fx.points), { ...SVM_DEFAULTS, ...p, epochs: 20 });
    for (const e of ["1", "5", "20"] as const) {
      const f = t.frames.find((q) => q.codeLine === "update" && q.state.epoch === Number(e))!;
      expect(f.state.alpha).toEqual(fx.epochs[e].alpha);
      expect(f.state.t).toBe(fx.epochs[e].t);
    }
  });

  it("records init, then pick + update per epoch, then done", () => {
    const t = runSvm(makeDataset("blobs"), SVM_DEFAULTS);
    expect(t.frames).toHaveLength(1 + 2 * SVM_DEFAULTS.epochs + 1);
    expect(t.frames.slice(1, 3).map((f) => f.codeLine)).toEqual(["pick", "update"]);
    for (const tag of ["start", "first-epoch", "epoch-5", "done"]) expect(frameIndexOfTag(t, tag), tag).toBeGreaterThanOrEqual(0);
  });

  it("separates two groups perfectly and marks support vectors on the margin", () => {
    const t = runSvm(makeDataset("blobs"), SVM_DEFAULTS);
    const last = t.frames.at(-1)!;
    expect(last.metrics.accuracy).toBe(1);
    expect(last.metrics.inside).toBeGreaterThanOrEqual(2);
    expect(last.metrics.supports).toBeLessThan(15);
  });

  it("a straight line fails on rings; the RBF kernel solves them", () => {
    const rings = makeDataset("circles");
    expect(accuracyOf(rings, "linear", 1)).toBeLessThan(0.8);
    expect(accuracyOf(rings, "rbf", 10)).toBeGreaterThanOrEqual(0.95);
  });

  it("a tiny C allows a wide street with more points inside it", () => {
    const data = makeDataset("overlap");
    const soft = runSvm(data, { ...SVM_DEFAULTS, C: 0.01 }).frames.at(-1)!.metrics.inside;
    const hard = runSvm(data, { ...SVM_DEFAULTS, C: 100 }).frames.at(-1)!.metrics.inside;
    expect(soft).toBeGreaterThan(hard);
  });

  it("decision() agrees with the recorded margins", () => {
    const pts = makeDataset("blobs");
    const t = runSvm(pts, SVM_DEFAULTS);
    const s = t.frames.at(-1)!.state;
    pts.forEach((p, i) => expect(decision(s, pts, p.x, p.y) * (p.c === 1 ? 1 : -1)).toBeCloseTo(s.margins[i], 9));
  });

  it("is deterministic for a seed and changes with another seed", () => {
    const pts = makeDataset("overlap");
    const a = runSvm(pts, SVM_DEFAULTS).frames.at(-1)!.state.alpha;
    expect(runSvm(pts, SVM_DEFAULTS).frames.at(-1)!.state.alpha).toEqual(a);
    expect(runSvm(pts, { ...SVM_DEFAULTS, seed: 2 }).frames.at(-1)!.state.alpha).not.toEqual(a);
  });
});

describe("validateSvm", () => {
  it.each([
    [[], "tooFew"],
    [[{ x: 1, y: 1, c: 0 }, { x: 2, y: 2, c: 1 }, { x: 3, y: 3, c: 1 }], "tooFew"],
    [[{ x: 1, y: 1, c: 0 }, { x: 2, y: 2, c: 0 }, { x: 3, y: 3, c: 0 }, { x: 4, y: 4, c: 0 }], "oneClass"],
  ])("case %#", (pts, err) => {
    expect(validateSvm(pts as LabeledPoint[])).toBe(err);
  });
});

describe("review fixes", () => {
  const angle = (w: [number, number]) => (Math.atan2(w[1], w[0]) * 180) / Math.PI;

  it("support vectors are exactly the points the boundary is built from (pushed at least once)", () => {
    const pts = makeDataset("overlap");
    const last = runSvm(pts, SVM_DEFAULTS).frames.at(-1)!;
    expect(last.metrics.supports).toBe(last.state.alpha.filter((a) => a > 0).length);
    expect(last.metrics.inside).toBe(last.state.margins.filter((m) => m <= 1 + 1e-9).length);
  });

  it("at C = 100 the street settles instead of spinning (averaged model)", () => {
    const pts = makeDataset("overlap");
    const t = runSvm(pts, { ...SVM_DEFAULTS, C: 100 });
    const updates = t.frames.filter((f) => f.codeLine === "update").slice(-6);
    const angles = updates.map((f) => angle(linearWeights(f.state, pts)));
    expect(Math.max(...angles) - Math.min(...angles)).toBeLessThan(10);
  });

  it("a larger C gives a narrower street", () => {
    const pts = makeDataset("overlap");
    const width = (C: number) => {
      const s = runSvm(pts, { ...SVM_DEFAULTS, C }).frames.at(-1)!.state;
      return 2 / Math.hypot(...linearWeights(s, pts));
    };
    expect(width(100)).toBeLessThan(width(1));
    expect(width(1)).toBeLessThan(width(0.01));
  });

  it("before any step nothing is a support vector", () => {
    expect(runSvm(makeDataset("blobs"), SVM_DEFAULTS).frames[0].metrics.supports).toBe(0);
  });
});
