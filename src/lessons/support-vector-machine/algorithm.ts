import { mulberry32 } from "@/engine/random";
import type { Frame, Trace } from "@/engine/types";
import type { LabeledPoint } from "../shared/datasets2d";

export type Kernel = "linear" | "rbf";

export interface SvmParams {
  /** How strict the margin is: large C = few violations allowed. */
  C: number;
  kernel: Kernel;
  /** RBF width: large gamma = very local influence. */
  gamma: number;
  epochs: number;
  seed: number;
}

export interface SvmState {
  epoch: number;
  /** Total single-point steps so far. */
  t: number;
  /** How many times each point has pushed the boundary (Pegasos multipliers). */
  alpha: number[];
  /**
   * The model actually drawn: f(x) = Σ coef_j·y_j·K(x_j, x). It is the Pegasos *averaged*
   * iterate (the average of α/(λ·t) over all steps), which settles where the last iterate
   * would keep jumping when C is large.
   */
  coef: number[];
  kernel: Kernel;
  gamma: number;
  mean: [number, number];
  std: [number, number];
  /** yᵢ·f(xᵢ) for every point: > 1 outside the street on the right side, < 0 wrong side. */
  margins: number[];
  /** Points that pushed during this epoch (inside the street or on the wrong side). */
  picked: number[];
}

export const SVM_DEFAULTS: SvmParams = { C: 1, kernel: "linear", gamma: 0.5, epochs: 20, seed: 1 };
export const SVM_LIMITS = {
  C: { min: 0.01, max: 100 },
  gamma: { min: 0.05, max: 20 },
  epochs: { min: 5, max: 60 },
} as const;

export function validateSvm(points: LabeledPoint[]): "tooFew" | "oneClass" | null {
  if (points.length < 4) return "tooFew";
  if (!points.some((p) => p.c === 0) || !points.some((p) => p.c === 1)) return "oneClass";
  return null;
}

function kernelFn(kind: Kernel, gamma: number) {
  // "+ 1" plays the role of the bias term.
  return kind === "linear"
    ? (a: readonly number[], b: readonly number[]) => a[0] * b[0] + a[1] * b[1] + 1
    : (a: readonly number[], b: readonly number[]) => Math.exp(-gamma * ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)) + 1;
}

function standardise(points: LabeledPoint[]) {
  const n = points.length;
  const ms = (vals: number[]): [number, number] => {
    const m = vals.reduce((a, v) => a + v, 0) / n;
    const s = Math.sqrt(vals.reduce((a, v) => a + (v - m) ** 2, 0) / n);
    return [m, s > 1e-12 ? s : 1];
  };
  const [mx, sx] = ms(points.map((p) => p.x));
  const [my, sy] = ms(points.map((p) => p.y));
  return { mean: [mx, my] as [number, number], std: [sx, sy] as [number, number] };
}

/** f(x, y) for the model in `s`, trained on `points`. Positive = class 1 side. */
export function decision(s: SvmState, points: LabeledPoint[], x: number, y: number): number {
  if (s.t === 0) return 0;
  const K = kernelFn(s.kernel, s.gamma);
  const q = [(x - s.mean[0]) / s.std[0], (y - s.mean[1]) / s.std[1]];
  let f = 0;
  points.forEach((p, j) => {
    if (s.coef[j] === 0) return;
    f += s.coef[j] * (p.c === 1 ? 1 : -1) * K([(p.x - s.mean[0]) / s.std[0], (p.y - s.mean[1]) / s.std[1]], q);
  });
  return f;
}

/** For the linear kernel: the weight vector w (in standardised units) of the drawn model. */
export function linearWeights(s: SvmState, points: LabeledPoint[]): [number, number] {
  let w0 = 0;
  let w1 = 0;
  points.forEach((p, j) => {
    const c = s.coef[j] * (p.c === 1 ? 1 : -1);
    w0 += c * ((p.x - s.mean[0]) / s.std[0]);
    w1 += c * ((p.y - s.mean[1]) / s.std[1]);
  });
  return [w0, w1];
}

export function shuffled(n: number, rand: () => number): number[] {
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export function runSvm(points: LabeledPoint[], p: SvmParams): Trace<SvmState> {
  const err = validateSvm(points);
  if (err) throw new Error(`Invalid data: ${err}`);
  const n = points.length;
  const { mean, std } = standardise(points);
  const Z = points.map((q) => [(q.x - mean[0]) / std[0], (q.y - mean[1]) / std[1]]);
  const y = points.map((q) => (q.c === 1 ? 1 : -1));
  const kf = kernelFn(p.kernel, p.gamma);
  const K = Z.map((a) => Z.map((b) => kf(a, b)));
  const lambda = 1 / (p.C * n);
  const rand = mulberry32(p.seed);

  const alpha = Array.from({ length: n }, () => 0);
  // Running sum of α/(λ·t) per point, for the averaged model.
  const sum = Array.from({ length: n }, () => 0);
  let t = 0;
  const frames: Frame<SvmState>[] = [];

  const snapshot = (epoch: number) => {
    const coef = sum.map((v) => (t === 0 ? 0 : v / t));
    const f = Z.map((_, i) => coef.reduce((acc, c, j) => (c === 0 ? acc : acc + c * y[j] * K[j][i]), 0));
    const margins = f.map((v, i) => y[i] * v);
    let norm = 0;
    for (let i = 0; i < n; i++) if (coef[i]) for (let j = 0; j < n; j++) if (coef[j]) norm += coef[i] * coef[j] * y[i] * y[j] * K[i][j];
    const hinge = margins.reduce((a, m) => a + Math.max(0, 1 - m), 0) / n;
    const state: SvmState = { epoch, t, alpha: [...alpha], coef, kernel: p.kernel, gamma: p.gamma, mean, std, margins, picked: [] };
    const metrics = {
      epoch,
      objective: (lambda / 2) * norm + hinge,
      accuracy: margins.filter((m) => m > 0).length / n,
      supports: alpha.filter((a) => a > 0).length,
      inside: t === 0 ? 0 : margins.filter((m) => m <= 1 + 1e-9).length,
    };
    return { state, metrics };
  };

  frames.push({ ...snapshot(0), codeLine: "init", event: "init", tags: ["start"] });
  for (let epoch = 1; epoch <= p.epochs; epoch++) {
    const before = snapshot(epoch - 1);
    const picked: number[] = [];
    for (const i of shuffled(n, rand)) {
      t++;
      let f = 0;
      for (let j = 0; j < n; j++) if (alpha[j]) f += alpha[j] * y[j] * K[j][i];
      if ((y[i] * f) / (lambda * t) < 1) {
        alpha[i] += 1;
        if (!picked.includes(i)) picked.push(i);
      }
      for (let j = 0; j < n; j++) if (alpha[j]) sum[j] += alpha[j] / (lambda * t);
    }
    // Which points pushed during this epoch, shown on the model as it was before it…
    frames.push({ state: { ...before.state, picked }, metrics: before.metrics, codeLine: "pick", event: "pick", tags: [] });
    // …then the model after it.
    const after = snapshot(epoch);
    frames.push({ state: { ...after.state, picked }, metrics: after.metrics, codeLine: "update", event: "update", tags: epoch === 1 ? ["first-epoch"] : epoch === 5 ? ["epoch-5"] : [] });
  }
  frames.push({ ...snapshot(p.epochs), codeLine: "return", event: "done", tags: ["done"] });
  return { frames, meta: { algorithm: "support-vector-machine", seed: p.seed, truncated: false } };
}
