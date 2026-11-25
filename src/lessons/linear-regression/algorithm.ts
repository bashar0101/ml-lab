import type { Frame, Trace } from "@/engine/types";

export interface Point {
  x: number;
  y: number;
}

export interface LrParams {
  learningRate: number;
  steps: number;
  initW: number;
  initB: number;
}

/** Model state in the scaled space the code works in (x standardised). */
export interface LrState {
  w: number;
  b: number;
  iteration: number;
  mean: number;
  std: number;
}

export const LR_DEFAULTS: LrParams = { learningRate: 0.1, steps: 40, initW: -10, initB: 20 };
export const LR_LIMITS = {
  learningRate: { min: 0.01, max: 1.2, step: 0.01 },
  steps: { min: 10, max: 200 },
} as const;

/** Above this the run is considered to have blown up. */
const DIVERGED_LOSS = 1e9;

export type LrDataError = "tooFew" | "sameX";

function meanStd(xs: number[]): { mean: number; std: number } {
  const mean = xs.reduce((s, v) => s + v, 0) / xs.length;
  const variance = xs.reduce((s, v) => s + (v - mean) ** 2, 0) / xs.length;
  return { mean, std: Math.sqrt(variance) };
}

export function validateData(points: Point[]): LrDataError | null {
  if (points.length < 2) return "tooFew";
  // Compare the x values themselves: with 3+ equal values the computed std can be ~1e-16, not 0.
  const x0 = points[0].x;
  if (points.every((p) => Math.abs(p.x - x0) <= 1e-9 * Math.max(1, Math.abs(x0)))) return "sameX";
  return null;
}

/** Mean squared error of the line w·x + b, with x standardised by mean/std. */
export function lrLoss(points: Point[], w: number, b: number, mean: number, std: number): number {
  let s = 0;
  for (const p of points) s += (w * ((p.x - mean) / std) + b - p.y) ** 2;
  return s / points.length;
}

/** The model's line in the data's own units. */
export function toLine(s: LrState): { slope: number; intercept: number } {
  const slope = s.w / s.std;
  return { slope, intercept: s.b - slope * s.mean };
}

export function runLinearRegression(points: Point[], p: LrParams): Trace<LrState> {
  const err = validateData(points);
  if (err) throw new Error(`Invalid data: ${err}`);

  const { mean, std } = meanStd(points.map((q) => q.x));
  const xs = points.map((q) => (q.x - mean) / std);
  const ys = points.map((q) => q.y);
  const n = points.length;

  let w = p.initW;
  let b = p.initB;
  let loss = lrLoss(points, w, b, mean, std);
  const frames: Frame<LrState>[] = [];

  const push = (iteration: number, codeLine: string, event: string, tags: string[] = []) => {
    const state: LrState = { w, b, iteration, mean, std };
    const line = toLine(state);
    frames.push({
      state,
      codeLine,
      event,
      tags,
      metrics: { loss, iteration, slope: line.slope, intercept: line.intercept },
    });
  };

  push(0, "init", "init", ["start"]);

  for (let i = 1; i <= p.steps; i++) {
    push(i, "predict", "predict");
    push(i, "error", "error");

    let gw = 0;
    let gb = 0;
    for (let k = 0; k < n; k++) {
      const e = w * xs[k] + b - ys[k];
      gw += e * xs[k];
      gb += e;
    }
    w -= p.learningRate * 2 * (gw / n);
    b -= p.learningRate * 2 * (gb / n);

    const before = loss;
    loss = lrLoss(points, w, b, mean, std);

    if (!Number.isFinite(loss) || loss > DIVERGED_LOSS) {
      push(i, "update", "diverged", ["diverged", "done"]);
      return { frames, meta: { algorithm: "linear-regression", seed: 0, truncated: false } };
    }

    const tags = i === 1 ? ["first-update"] : i === 8 ? ["update-8"] : [];
    push(i, "update", loss > before ? "overshoot" : "update", tags);
  }

  push(p.steps, "return", "done", ["done"]);
  return { frames, meta: { algorithm: "linear-regression", seed: 0, truncated: false } };
}
