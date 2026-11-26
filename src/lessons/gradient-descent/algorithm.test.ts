import { describe, expect, it } from "vitest";
import { frameIndexOfTag } from "@/engine/types";
import { GD_DEFAULTS, runGradientDescent, type Optimizer } from "./algorithm";
import fixtures from "./fixtures.json";
import { SURFACES, type SurfaceId } from "./surfaces";

const OPTS: Optimizer[] = ["plain", "momentum", "adam"];

describe("surfaces", () => {
  it.each(SURFACES.map((s) => [s.id, s] as const))("%s gradient matches a numerical derivative", (_id, s) => {
    for (const [x, y] of [[0.3, -0.7], [1.2, 0.4], [-2, 1.5]]) {
      const h = 1e-6;
      const [gx, gy] = s.grad(x, y);
      expect(gx).toBeCloseTo((s.f(x + h, y) - s.f(x - h, y)) / (2 * h), 4);
      expect(gy).toBeCloseTo((s.f(x, y + h) - s.f(x, y - h)) / (2 * h), 4);
    }
  });
});

describe("runGradientDescent", () => {
  for (const s of SURFACES)
    for (const opt of OPTS)
      it(`matches NumPy: ${s.id} / ${opt}`, () => {
        const fx = fixtures[s.id as SurfaceId][opt] as Record<string, [number, number]>;
        const t = runGradientDescent({ surface: s.id, optimizer: opt, compare: false, learningRate: s.lr, steps: 40 });
        const after = (step: number) => t.frames.filter((f) => f.codeLine.startsWith("update") && f.state.step === step)[0].state.walkers[0];
        for (const step of [1, 10, 40]) {
          expect(after(step).x).toBeCloseTo(fx[String(step)][0], 9);
          expect(after(step).y).toBeCloseTo(fx[String(step)][1], 9);
        }
      });

  it("records init, then grad + update per step, then done", () => {
    const t = runGradientDescent(GD_DEFAULTS);
    expect(t.frames).toHaveLength(1 + 2 * 40 + 1);
    expect(t.frames[0]).toMatchObject({ event: "init", codeLine: "init", tags: ["start"] });
    expect(t.frames[1]).toMatchObject({ event: "grad", codeLine: "grad", tags: ["first-grad"] });
    expect(t.frames[2]).toMatchObject({ event: "update", codeLine: "update-plain", tags: ["first-step"] });
    expect(frameIndexOfTag(t, "step-10")).toBe(20);
    expect(t.frames.at(-1)).toMatchObject({ event: "done", codeLine: "return", tags: ["done"] });
  });

  it("the default ravine run zig-zags (y changes sign) and still reaches the bottom", () => {
    const t = runGradientDescent(GD_DEFAULTS);
    const ys = t.frames.filter((f) => f.codeLine === "update-plain").map((f) => f.state.walkers[0].y);
    expect(ys.slice(0, 6).some((y, i) => i > 0 && Math.sign(y) !== Math.sign(ys[i - 1]))).toBe(true);
    expect(t.frames.at(-1)!.metrics.f).toBeLessThan(0.01);
  });

  it("learning rate 0.21 on the ravine diverges with a diverged frame and no NaN", () => {
    const t = runGradientDescent({ ...GD_DEFAULTS, learningRate: 0.21, steps: 120 });
    const last = t.frames.at(-1)!;
    expect(last).toMatchObject({ event: "diverged" });
    expect(last.tags).toEqual(expect.arrayContaining(["diverged", "done"]));
    for (const f of t.frames) for (const v of Object.values(f.metrics)) expect(Number.isNaN(v)).toBe(false);
  });

  it("two valleys: plain gets stuck on the right, momentum reaches the deeper left valley", () => {
    const base = { surface: "two-valleys" as const, compare: false, learningRate: 0.05, steps: 40 };
    const end = (optimizer: Optimizer) => runGradientDescent({ ...base, optimizer }).frames.at(-1)!.state.walkers[0];
    expect(end("plain").x).toBeGreaterThan(0.5);
    expect(end("momentum").x).toBeLessThan(-0.5);
  });

  it("compare carries all three walkers; the chosen optimizer is first and drives the code line", () => {
    const t = runGradientDescent({ ...GD_DEFAULTS, optimizer: "adam", compare: true });
    expect(t.frames[0].state.walkers.map((w) => w.optimizer)).toEqual(["adam", "plain", "momentum"]);
    expect(t.frames[2].codeLine).toBe("update-adam");
  });

  it("a diverging companion walker freezes without stopping the run", () => {
    const t = runGradientDescent({ surface: "two-valleys", optimizer: "adam", compare: true, learningRate: 0.18, steps: 40 });
    const last = t.frames.at(-1)!;
    expect(last.event).toBe("done");
    const plain = last.state.walkers.find((w) => w.optimizer === "plain")!;
    expect(plain.diverged).toBe(true);
    expect(Number.isFinite(plain.x) && Number.isFinite(plain.y)).toBe(true);
  });

  it("uses a custom start point when given", () => {
    const t = runGradientDescent({ ...GD_DEFAULTS, start: [1, -1] });
    expect(t.frames[0].state.walkers[0]).toMatchObject({ x: 1, y: -1 });
  });
});
