import { describe, expect, it } from "vitest";
import { liveLessons } from "@/course/manifest";
import { byHandFor, LAB_EXAMPLES } from "./byHand";
import gradientDescent from "./gradient-descent";
import kMeans from "./k-means";
import kNearestNeighbors from "./k-nearest-neighbors";
import linearRegression from "./linear-regression";
import pca from "./pca";
import { loadLessonModule } from "./registry";
import supportVectorMachine from "./support-vector-machine";
import type { AnyLessonModule } from "./types";

/** All the numbers the paper example states, from every step. */
const paper = (slug: string) => {
  const ex = byHandFor(slug)!;
  return Object.assign({}, ex.vars, ...ex.steps.map((s) => s.vars ?? {})) as Record<string, string>;
};
const num = (s: string) => Number(s.replace("−", "-"));

/** Runs the lesson's Lab on its paper example, exactly as the "Try it in the Lab" button does. */
function runPaper(mod: AnyLessonModule) {
  expect(mod.byHand, `${mod.slug} has no paper example for the Lab`).toBeDefined();
  const { data, params } = mod.byHand!;
  expect(mod.validate(data)).toBeNull();
  const trace = mod.run(data, params);
  return { trace, last: trace.frames[trace.frames.length - 1] };
}

describe("the Lab, started on the paper example, shows the paper's numbers", () => {
  it("lists exactly the lessons whose Lab has the paper example", async () => {
    for (const l of liveLessons()) {
      const mod = await loadLessonModule(l.slug);
      expect(!!mod.byHand, l.slug).toBe(LAB_EXAMPLES.has(l.slug));
    }
  });

  it("k-NN: nearest distance 1.41, k = 3, and the winner is good (class A)", () => {
    const { last } = runPaper(kNearestNeighbors);
    expect(last.metrics.k).toBe(3);
    expect(last.metrics.nearest).toBeCloseTo(num(paper("k-nearest-neighbors").d1), 2);
    expect(last.state.prediction).toBe(0);
  });

  it("linear regression: gradient descent ends on the paper's line", () => {
    const { last } = runPaper(linearRegression);
    expect(last.metrics.slope).toBeCloseTo(num(paper("linear-regression").slope), 2);
    expect(last.metrics.intercept).toBeCloseTo(num(paper("linear-regression").intercept), 1);
  });

  it("gradient descent: the ball takes the paper's steps", () => {
    const { trace } = runPaper(gradientDescent);
    const xs = trace.frames.map((f) => f.state.walkers[0].x);
    const unique = xs.filter((x, i) => i === 0 || x !== xs[i - 1]);
    const p = paper("gradient-descent");
    expect(unique.slice(0, 4)).toEqual([num(p.w0), num(p.w1), num(p.w2), num(p.w3)]);
    for (const f of trace.frames) expect(f.state.walkers[0].y).toBe(0);
  });

  it("k-means: starts from the first two points and settles on the paper's centres", () => {
    const { trace, last } = runPaper(kMeans);
    expect(trace.frames[0].state.centroids).toEqual([
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ]);
    const fmt = (c: { x: number; y: number }) => `(${Math.round(c.x * 100) / 100}, ${Math.round(c.y * 100) / 100})`;
    expect(last.state.centroids.map(fmt)).toEqual([paper("k-means").c1, paper("k-means").c2]);
  });

  it("PCA: 45°, the paper's first eigenvalue and the same % kept", () => {
    const { last } = runPaper(pca);
    const p = paper("pca");
    expect(last.state.pc1Angle).toBeCloseTo(45, 6);
    expect(last.state.lambda1).toBeCloseTo(num(p.l1), 2);
    expect(last.state.lambda2).toBeCloseTo(num(p.l2), 2);
    expect(last.metrics.explained * 100).toBeCloseTo(num(p.kept), 1);
  });

  it("SVM: trained, not given, so it lands close: the paper's supports near 1, the rest near 2", () => {
    const { last } = runPaper(supportVectorMachine);
    expect(last.metrics.accuracy).toBe(1);
    // Paper order: (3, 3), (4, 3), (3, 4), (2, 2), (1, 2), (2, 1); y · f(x) = 1, 2, 2, 1, 2, 2 on paper.
    const m = last.state.margins;
    for (const i of [0, 3]) expect(Math.abs(m[i] - 1)).toBeLessThan(0.15);
    for (const i of [1, 2, 4, 5]) expect(Math.abs(m[i] - 2)).toBeLessThan(0.2);
  });
});
