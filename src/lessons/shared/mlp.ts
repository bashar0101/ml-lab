import { mulberry32 } from "@/engine/random";

export type Activation = "tanh" | "relu" | "sigmoid";

/** A small fully-connected network. W[l][j][i]: layer l, neuron j, input i. One sigmoid output. */
export interface Mlp {
  sizes: number[];
  activation: Activation;
  W: number[][][];
  b: number[][];
}

export interface ForwardPass {
  /** z[l]: pre-activations of weight layer l. */
  z: number[][];
  /** a[0] = input; a[l + 1] = activations after weight layer l (last = output probability). */
  a: number[][];
}

const sigmoid = (v: number) => 1 / (1 + Math.exp(-v));
const ACT: Record<Activation, { f(v: number): number; df(v: number): number }> = {
  tanh: { f: Math.tanh, df: (v) => 1 - Math.tanh(v) ** 2 },
  relu: { f: (v) => Math.max(v, 0), df: (v) => (v > 0 ? 1 : 0) },
  sigmoid: { f: sigmoid, df: (v) => sigmoid(v) * (1 - sigmoid(v)) },
};
const EPS = 1e-12;
const BLOWN = 1e6;

export function initMlp(sizes: number[], activation: Activation, seed: number): Mlp {
  const rand = mulberry32(seed);
  const gauss = () => {
    const u = Math.max(rand(), 1e-12);
    const v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const W: number[][][] = [];
  const b: number[][] = [];
  for (let l = 0; l + 1 < sizes.length; l++) {
    const std = Math.sqrt((activation === "relu" ? 2 : 1) / sizes[l]);
    W.push(Array.from({ length: sizes[l + 1] }, () => Array.from({ length: sizes[l] }, () => gauss() * std)));
    b.push(Array.from({ length: sizes[l + 1] }, () => 0));
  }
  return { sizes: [...sizes], activation, W, b };
}

export function forward(net: Mlp, x: number[]): ForwardPass {
  const a: number[][] = [[...x]];
  const z: number[][] = [];
  const L = net.W.length;
  for (let l = 0; l < L; l++) {
    const prev = a[l];
    const zl = net.W[l].map((row, j) => row.reduce((s, w, i) => s + w * prev[i], net.b[l][j]));
    z.push(zl);
    a.push(zl.map(l === L - 1 ? sigmoid : ACT[net.activation].f));
  }
  return { z, a };
}

/** Gradients of the log-loss for one example. */
export function backward(net: Mlp, f: ForwardPass, y: 0 | 1): { dz: number[][]; dW: number[][][] } {
  const L = net.W.length;
  const dz: number[][] = Array.from({ length: L }, () => []);
  dz[L - 1] = f.a[L].map((p) => p - y);
  for (let l = L - 2; l >= 0; l--) {
    dz[l] = f.z[l].map((zv, i) => net.W[l + 1].reduce((s, row, j) => s + row[i] * dz[l + 1][j], 0) * ACT[net.activation].df(zv));
  }
  const dW = dz.map((d, l) => d.map((dj) => f.a[l].map((ai) => dj * ai)));
  return { dz, dW };
}

export function lossOf(net: Mlp, X: number[][], Y: (0 | 1)[]): number {
  let s = 0;
  X.forEach((x, k) => {
    const p = Math.min(1 - EPS, Math.max(EPS, forward(net, x).a.at(-1)![0]));
    s -= Y[k] * Math.log(p) + (1 - Y[k]) * Math.log(1 - p);
  });
  return s / X.length;
}

/** One full-batch gradient-descent step. Diverging weights leave the network unchanged. */
export function trainEpoch(net: Mlp, X: number[][], Y: (0 | 1)[], lr: number): { net: Mlp; loss: number; gradNorms: number[]; diverged: boolean } {
  const gW = net.W.map((layer) => layer.map((row) => row.map(() => 0)));
  const gb = net.b.map((layer) => layer.map(() => 0));
  const n = X.length;
  const L = net.W.length;
  const act = ACT[net.activation];
  // Same arithmetic as forward() + backward(), in plain loops: this runs thousands of times per lesson.
  const a: number[][] = [[], ...net.sizes.slice(1).map((s) => new Array<number>(s).fill(0))];
  const z: number[][] = net.sizes.slice(1).map((s) => new Array<number>(s).fill(0));
  const dz: number[][] = net.sizes.slice(1).map((s) => new Array<number>(s).fill(0));
  let loss = 0;
  for (let k = 0; k < n; k++) {
    a[0] = X[k];
    for (let l = 0; l < L; l++) {
      const Wl = net.W[l];
      const prev = a[l];
      for (let j = 0; j < Wl.length; j++) {
        let s = net.b[l][j];
        const row = Wl[j];
        for (let i = 0; i < row.length; i++) s += row[i] * prev[i];
        z[l][j] = s;
        a[l + 1][j] = l === L - 1 ? sigmoid(s) : act.f(s);
      }
    }
    const p = a[L][0];
    const pc = Math.min(1 - EPS, Math.max(EPS, p));
    loss -= Y[k] * Math.log(pc) + (1 - Y[k]) * Math.log(1 - pc);
    dz[L - 1][0] = p - Y[k];
    for (let l = L - 2; l >= 0; l--) {
      const next = net.W[l + 1];
      for (let i = 0; i < z[l].length; i++) {
        let s = 0;
        for (let j = 0; j < next.length; j++) s += next[j][i] * dz[l + 1][j];
        dz[l][i] = s * act.df(z[l][i]);
      }
    }
    for (let l = 0; l < L; l++)
      for (let j = 0; j < dz[l].length; j++) {
        const d = dz[l][j];
        const row = gW[l][j];
        const prev = a[l];
        for (let i = 0; i < row.length; i++) row[i] += (d * prev[i]) / n;
        gb[l][j] += d / n;
      }
  }
  loss /= n;
  const gradNorms = gW.map((layer) => Math.sqrt(layer.flat().reduce((s, v) => s + v * v, 0)));
  const next: Mlp = {
    ...net,
    W: net.W.map((layer, l) => layer.map((row, j) => row.map((w, i) => w - lr * gW[l][j][i]))),
    b: net.b.map((layer, l) => layer.map((v, j) => v - lr * gb[l][j])),
  };
  const ok = [...next.W.flat(2), ...next.b.flat()].every((v) => Number.isFinite(v) && Math.abs(v) < BLOWN);
  return { net: ok ? next : net, loss, gradNorms, diverged: !ok };
}

export function predict(net: Mlp, x: number[]): number {
  return forward(net, x).a.at(-1)![0];
}
