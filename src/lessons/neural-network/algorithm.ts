import type { Frame, Trace } from "@/engine/types";
import type { LabeledPoint } from "../shared/datasets2d";
import { initMlp, lossOf, predict, trainEpoch, type Activation, type Mlp } from "../shared/mlp";

export interface NetParams {
  /** Neurons per hidden layer. */
  hidden: number[];
  activation: Activation;
  learningRate: number;
  epochs: number;
  seed: number;
}

export interface NetState {
  net: Mlp;
  epoch: number;
  /** On forward frames: how many layers of the probe point's pass are shown (0 = inputs only). */
  layer: number | null;
  /** Index of the point whose forward pass is shown. */
  probe: number;
  mean: [number, number];
  std: [number, number];
}

export const NN_DEFAULTS: NetParams = { hidden: [4], activation: "tanh", learningRate: 0.5, epochs: 300, seed: 1 };
export const NN_LIMITS = {
  layers: { min: 1, max: 3 },
  neurons: { min: 1, max: 8 },
  learningRate: { min: 0.01, max: 10 },
  epochs: { min: 30, max: 600 },
} as const;
const SNAPSHOTS = 30;

export function validateNet(points: LabeledPoint[]): "tooFew" | "oneClass" | null {
  if (points.length < 4) return "tooFew";
  if (!points.some((p) => p.c === 0) || !points.some((p) => p.c === 1)) return "oneClass";
  return null;
}

export function standardiser(points: LabeledPoint[]) {
  const n = points.length;
  const m = [0, 1].map((k) => points.reduce((a, p) => a + (k ? p.y : p.x), 0) / n) as [number, number];
  const s = [0, 1].map((k) => {
    const sd = Math.sqrt(points.reduce((a, p) => a + ((k ? p.y : p.x) - m[k]) ** 2, 0) / n);
    return sd > 1e-12 ? sd : 1;
  }) as [number, number];
  return { mean: m, std: s, apply: (x: number, y: number) => [(x - m[0]) / s[0], (y - m[1]) / s[1]] };
}

export function runNeuralNet(points: LabeledPoint[], p: NetParams): Trace<NetState> {
  const err = validateNet(points);
  if (err) throw new Error(`Invalid data: ${err}`);
  const st = standardiser(points);
  const X = points.map((q) => st.apply(q.x, q.y));
  const Y = points.map((q) => (q.c === 1 ? 1 : 0) as 0 | 1);
  let net = initMlp([2, ...p.hidden, 1], p.activation, p.seed);
  const frames: Frame<NetState>[] = [];
  const accuracy = (m: Mlp) => X.filter((x, i) => (predict(m, x) >= 0.5 ? 1 : 0) === Y[i]).length / X.length;
  const push = (epoch: number, layer: number | null, codeLine: string, event: string, tags: string[] = []) =>
    frames.push({
      state: { net, epoch, layer, probe: 0, mean: st.mean, std: st.std },
      codeLine,
      event,
      tags,
      metrics: { epoch, loss: lossOf(net, X, Y), accuracy: accuracy(net) },
    });

  push(0, null, "init", "init", ["start"]);
  // One point's journey through the untrained network, layer by layer.
  push(0, 0, "input", "input", ["forward-input"]);
  p.hidden.forEach((_, l) => push(0, l + 1, "hidden", "hidden", l === 0 ? ["forward-hidden"] : []));
  push(0, p.hidden.length + 1, "output", "output", ["forward-output"]);

  const every = Math.max(1, Math.floor(p.epochs / SNAPSHOTS));
  let snaps = 0;
  for (let e = 1; e <= p.epochs; e++) {
    const r = trainEpoch(net, X, Y, p.learningRate);
    if (r.diverged) {
      push(e, null, "update", "diverged", ["diverged", "done"]);
      return { frames, meta: { algorithm: "neural-network", seed: p.seed, truncated: false } };
    }
    net = r.net;
    if (e % every === 0 || e === p.epochs) {
      snaps++;
      const tags = snaps === 1 ? ["train-first"] : snaps === Math.ceil(SNAPSHOTS / 2) ? ["train-half"] : [];
      push(e, null, "update", "train", tags);
    }
  }
  push(p.epochs, null, "return", "done", ["done"]);
  return { frames, meta: { algorithm: "neural-network", seed: p.seed, truncated: false } };
}
