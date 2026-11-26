import type { Frame, Trace } from "@/engine/types";
import type { LabeledPoint } from "../shared/datasets2d";

export interface LogParams {
  learningRate: number;
  steps: number;
  /** Probability above which a point is called class 1 (affects accuracy and the line, not training). */
  threshold: number;
}

export interface LogState {
  step: number;
  w: [number, number];
  b: number;
  mean: [number, number];
  std: [number, number];
  /** Predicted probability of class 1 for every point, in data order. */
  probs: number[];
  threshold: number;
}

export const LOG_DEFAULTS: LogParams = { learningRate: 0.5, steps: 60, threshold: 0.5 };
export const LOG_LIMITS = {
  learningRate: { min: 0.05, max: 5, step: 0.05 },
  steps: { min: 10, max: 200 },
  threshold: { min: 0.05, max: 0.95, step: 0.05 },
} as const;

const EPS = 1e-12;
const BLOWN = 1e6;

export const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

export function validateLogistic(points: LabeledPoint[]): "tooFew" | "oneClass" | null {
  if (points.length < 4) return "tooFew";
  if (!points.some((p) => p.c === 0) || !points.some((p) => p.c === 1)) return "oneClass";
  return null;
}

function stats(values: number[]): [number, number] {
  const m = values.reduce((a, v) => a + v, 0) / values.length;
  const s = Math.sqrt(values.reduce((a, v) => a + (v - m) ** 2, 0) / values.length);
  // A feature with no spread carries no information: scale by 1 so it stays at 0.
  return [m, s > 1e-12 ? s : 1];
}

export function logit(s: Pick<LogState, "w" | "b" | "mean" | "std">, x: number, y: number): number {
  return s.w[0] * ((x - s.mean[0]) / s.std[0]) + s.w[1] * ((y - s.mean[1]) / s.std[1]) + s.b;
}

export function probability(s: Pick<LogState, "w" | "b" | "mean" | "std">, x: number, y: number): number {
  return sigmoid(logit(s, x, y));
}

/** Where the probability equals `threshold`, in data units. */
export function boundaryLine(
  s: Pick<LogState, "w" | "b" | "mean" | "std">,
  threshold: number,
): { kind: "line"; slope: number; intercept: number } | { kind: "vertical"; x: number } | { kind: "none" } {
  const L = Math.log(threshold / (1 - threshold));
  const a = s.w[0] / s.std[0];
  const c = s.w[1] / s.std[1];
  const k = L - s.b + a * s.mean[0] + c * s.mean[1]; // a·x + c·y = k
  if (Math.abs(c) > 1e-12) return { kind: "line", slope: -a / c, intercept: k / c };
  if (Math.abs(a) > 1e-12) return { kind: "vertical", x: k / a };
  return { kind: "none" };
}

export function runLogistic(points: LabeledPoint[], p: LogParams): Trace<LogState> {
  const err = validateLogistic(points);
  if (err) throw new Error(`Invalid data: ${err}`);
  const n = points.length;
  const mean: [number, number] = [0, 0];
  const std: [number, number] = [1, 1];
  [mean[0], std[0]] = stats(points.map((q) => q.x));
  [mean[1], std[1]] = stats(points.map((q) => q.y));
  const z = points.map((q) => [(q.x - mean[0]) / std[0], (q.y - mean[1]) / std[1]] as const);
  const ys = points.map((q) => q.c);

  let w: [number, number] = [0, 0];
  let b = 0;
  const frames: Frame<LogState>[] = [];
  const meta = { algorithm: "logistic-regression", seed: 0, truncated: false };

  const measure = () => {
    const probs = z.map(([a, c]) => sigmoid(w[0] * a + w[1] * c + b));
    let loss = 0;
    let correct = 0;
    probs.forEach((q, i) => {
      const pc = Math.min(1 - EPS, Math.max(EPS, q));
      loss -= ys[i] * Math.log(pc) + (1 - ys[i]) * Math.log(1 - pc);
      if ((q >= p.threshold ? 1 : 0) === ys[i]) correct++;
    });
    return { probs, loss: loss / n, accuracy: correct / n };
  };

  const push = (step: number, codeLine: string, event: string, tags: string[] = []) => {
    const m = measure();
    frames.push({
      state: { step, w: [...w], b, mean, std, probs: m.probs, threshold: p.threshold },
      codeLine,
      event,
      tags,
      metrics: { step, loss: m.loss, accuracy: m.accuracy },
    });
  };

  push(0, "init", "init", ["start"]);
  for (let step = 1; step <= p.steps; step++) {
    push(step, "predict", "predict");
    push(step, "error", "error");
    const probs = z.map(([a, c]) => sigmoid(w[0] * a + w[1] * c + b));
    let g0 = 0;
    let g1 = 0;
    let gb = 0;
    probs.forEach((q, i) => {
      const e = q - ys[i];
      g0 += e * z[i][0];
      g1 += e * z[i][1];
      gb += e;
    });
    w = [w[0] - (p.learningRate * g0) / n, w[1] - (p.learningRate * g1) / n];
    b -= (p.learningRate * gb) / n;
    if (![...w, b].every((v) => Number.isFinite(v) && Math.abs(v) < BLOWN)) {
      push(step, "update", "diverged", ["diverged", "done"]);
      return { frames, meta };
    }
    push(step, "update", "update", step === 1 ? ["first-update"] : step === 10 ? ["update-10"] : []);
  }
  push(p.steps, "return", "done", ["done"]);
  return { frames, meta };
}
