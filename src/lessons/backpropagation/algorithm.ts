import type { Frame, Trace } from "@/engine/types";
import type { LabeledPoint } from "../shared/datasets2d";
import { backward, forward, initMlp, trainEpoch, type Activation, type ForwardPass, type Mlp } from "../shared/mlp";
import { standardiser } from "../neural-network/algorithm";

export interface BackpropParams {
  /** Hidden layers of three neurons each. */
  depth: number;
  activation: Activation;
  learningRate: number;
  seed: number;
}

export interface BackpropState {
  net: Mlp;
  /** Forward pass of the example (with the weights before the update). */
  fwd: ForwardPass;
  grad: { dz: number[][]; dW: number[][][] };
  /** Layers of activations shown after the inputs (forward frames grow this). */
  shownForward: number;
  /** Weight layers whose blame (dz) is shown, counted from the output. */
  shownBackward: number;
  showGrads: boolean;
  updated: boolean;
  /** Gradient size per weight layer, one row per full-batch epoch. */
  history: number[][];
  x: number[];
  y: 0 | 1;
}

export const BP_DEFAULTS: BackpropParams = { depth: 1, activation: "tanh", learningRate: 0.5, seed: 1 };
export const BP_LIMITS = { depth: { min: 1, max: 5 }, learningRate: { min: 0.01, max: 10 } } as const;
export const EPOCHS = 40;
const EPS = 1e-12;

export function validateBackprop(points: LabeledPoint[]): "tooFew" | "oneClass" | null {
  if (points.length < 4) return "tooFew";
  if (!points.some((p) => p.c === 0) || !points.some((p) => p.c === 1)) return "oneClass";
  return null;
}

export function runBackprop(points: LabeledPoint[], p: BackpropParams): Trace<BackpropState> {
  const err = validateBackprop(points);
  if (err) throw new Error(`Invalid data: ${err}`);
  const st = standardiser(points);
  const X = points.map((q) => st.apply(q.x, q.y));
  const Y = points.map((q) => (q.c === 1 ? 1 : 0) as 0 | 1);
  const start = initMlp([2, ...Array.from({ length: p.depth }, () => 3), 1], p.activation, p.seed);
  const L = start.W.length;
  const fwd = forward(start, X[0]);
  const grad = backward(start, fwd, Y[0]);
  const prob = fwd.a[L][0];
  const exampleLoss = -(Y[0] * Math.log(Math.max(EPS, prob)) + (1 - Y[0]) * Math.log(Math.max(EPS, 1 - prob)));

  let state: BackpropState = { net: start, fwd, grad, shownForward: 0, shownBackward: 0, showGrads: false, updated: false, history: [], x: X[0], y: Y[0] };
  const frames: Frame<BackpropState>[] = [];
  const push = (codeLine: string, event: string, tags: string[] = [], metrics: Record<string, number> = {}) =>
    frames.push({ state: { ...state, history: state.history.map((r) => [...r]) }, codeLine, event, tags, metrics: { loss: exampleLoss, prediction: prob, ...metrics } });

  push("init", "init", ["start"]);
  for (let l = 1; l <= L; l++) {
    state = { ...state, shownForward: l };
    push("forward", "forward", l === 1 ? ["forward-1"] : l === L ? ["forward-out"] : []);
  }
  push("loss", "loss", ["loss"]);
  for (let k = 1; k <= L; k++) {
    state = { ...state, shownBackward: k };
    push("backward", "backward", k === 1 ? ["backward-out"] : k === 2 ? ["backward-hidden"] : []);
  }
  state = { ...state, showGrads: true };
  push("grads", "grads", ["grads"]);
  const stepped: Mlp = { ...start, W: start.W.map((layer, l) => layer.map((row, j) => row.map((w, i) => w - p.learningRate * grad.dW[l][j][i]))) };
  const ok = stepped.W.flat(2).every((v) => Number.isFinite(v));
  state = { ...state, net: ok ? stepped : start, updated: true };
  push("update", "update", ["update"]);

  // Now train on every point and watch how big each layer's gradient is.
  let net = start;
  for (let e = 1; e <= EPOCHS; e++) {
    const r = trainEpoch(net, X, Y, p.learningRate);
    state = { ...state, net: r.net, history: [...state.history, r.gradNorms] };
    const first = r.gradNorms[0];
    const last = r.gradNorms[r.gradNorms.length - 1];
    push("epoch", "epoch", e === 1 ? ["epochs"] : [], { epoch: e, first, last, ratio: first > 0 ? last / first : 0 });
    if (r.diverged) break;
    net = r.net;
  }
  push("return", "done", ["done"]);
  return { frames, meta: { algorithm: "backpropagation", seed: p.seed, truncated: false } };
}
