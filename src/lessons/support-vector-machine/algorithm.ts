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
  /** 1 / (λ·t); 0 before the first step. */
  scale: number;
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
  if (s.scale === 0) return 0;
  const K = kernelFn(s.kernel, s.gamma);
  const q = [(x - s.mean[0]) / s.std[0], (y - s.mean[1]) / s.std[1]];
  let f = 0;
  points.forEach((p, j) => {
    if (s.alpha[j] === 0) return;
    f += s.alpha[j] * (p.c === 1 ? 1 : -1) * K([(p.x - s.mean[0]) / s.std[0], (p.y - s.mean[1]) / s.std[1]], q);
  });
  return s.scale * f;
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
  let t = 0;
  const frames: Frame<SvmState>[] = [];

  const snapshot = (epoch: number, picked: number[]) => {
    const scale = t === 0 ? 0 : 1 / (lambda * t);
    const f = Z.map((_, i) => scale * alpha.reduce((acc, a, j) => (a === 0 ? acc : acc + a * y[j] * K[j][i]), 0));
    const margins = f.map((v, i) => y[i] * v);
    let norm = 0;
    for (let i = 0; i < n; i++) if (alpha[i]) for (let j = 0; j < n; j++) if (alpha[j]) norm += alpha[i] * alpha[j] * y[i] * y[j] * K[i][j];
    const hinge = margins.reduce((a, m) => a + Math.max(0, 1 - m), 0) / n;
    const state: SvmState = { epoch, t, alpha: [...alpha], scale, kernel: p.kernel, gamma: p.gamma, mean, std, margins, picked };
    const metrics = {
      epoch,
      objective: (lambda / 2) * scale * scale * norm + hinge,
      accuracy: margins.filter((m) => m > 0).length / n,
      supports: margins.filter((m) => m <= 1 + 1e-9).length,
    };
    return { state, metrics };
  };
  const push = (epoch: number, picked: number[], codeLine: string, event: string, tags: string[] = []) =>
    frames.push({ ...snapshot(epoch, picked), codeLine, event, tags });

  push(0, [], "init", "init", ["start"]);
  for (let epoch = 1; epoch <= p.epochs; epoch++) {
    const before = [...alpha];
    const tBefore = t;
    const picked: number[] = [];
    for (const i of shuffled(n, rand)) {
      t++;
      let f = 0;
      for (let j = 0; j < n; j++) if (alpha[j]) f += alpha[j] * y[j] * K[j][i];
      if ((y[i] * f) / (lambda * t) < 1) {
        alpha[i] += 1;
        if (!picked.includes(i)) picked.push(i);
      }
    }
    // Show which points pushed this epoch on the boundary as it was before the epoch…
    const after = [...alpha];
    const tAfter = t;
    alpha.splice(0, n, ...before);
    t = tBefore;
    push(epoch - 1, picked, "pick", "pick");
    // …then the boundary after it.
    alpha.splice(0, n, ...after);
    t = tAfter;
    push(epoch, picked, "update", "update", epoch === 1 ? ["first-epoch"] : epoch === 5 ? ["epoch-5"] : []);
  }
  push(p.epochs, [], "return", "done", ["done"]);
  return { frames, meta: { algorithm: "support-vector-machine", seed: p.seed, truncated: false } };
}
