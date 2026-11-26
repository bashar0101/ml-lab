import { describe, expect, it } from "vitest";
import fixtures from "../neural-network/fixtures.json";
import { backward, forward, initMlp, lossOf, trainEpoch, type Mlp } from "./mlp";

const pts = fixtures.points;
const mean = [0, 1].map((k) => pts.reduce((a, p) => a + p[k], 0) / pts.length);
const std = [0, 1].map((k) => Math.sqrt(pts.reduce((a, p) => a + (p[k] - mean[k]) ** 2, 0) / pts.length));
const X = pts.map((p) => [(p[0] - mean[0]) / std[0], (p[1] - mean[1]) / std[1]]);
const Y = pts.map((p) => p[2] as 0 | 1);

const closeNested = (a: unknown, b: unknown, digits = 10): void => {
  if (Array.isArray(a) && Array.isArray(b)) {
    expect(a.length).toBe(b.length);
    a.forEach((v, i) => closeNested(v, b[i], digits));
  } else expect(a as number).toBeCloseTo(b as number, digits);
};

describe("mlp", () => {
  it("initialises weights exactly like the Python reference", () => {
    closeNested(initMlp([2, 3, 1], "tanh", 1).W, fixtures.tanh.W, 12);
    closeNested(initMlp([2, 4, 4, 1], "relu", 2).W, fixtures.relu.W, 12);
  });

  it("forward and backward match the reference for one example", () => {
    const net = initMlp([2, 3, 1], "tanh", 1);
    const f = forward(net, X[0]);
    closeNested(f.a, fixtures.tanh.a);
    const g = backward(net, f, Y[0]);
    closeNested(g.dz, fixtures.tanh.dz);
    closeNested(g.dW, fixtures.tanh.dW);
  });

  it("backward agrees with a numerical gradient", () => {
    for (const activation of ["tanh", "relu", "sigmoid"] as const) {
      const net = initMlp([2, 4, 3, 1], activation, 3);
      const x = [0.3, -0.8];
      const g = backward(net, forward(net, x), 1);
      const h = 1e-6;
      for (const [l, j, i] of [[0, 1, 0], [1, 2, 3], [2, 0, 1]]) {
        const plus: Mlp = structuredClone(net);
        const minus: Mlp = structuredClone(net);
        plus.W[l][j][i] += h;
        minus.W[l][j][i] -= h;
        const num = (lossOf(plus, [x], [1]) - lossOf(minus, [x], [1])) / (2 * h);
        expect(g.dW[l][j][i]).toBeCloseTo(num, 5);
      }
    }
  });

  it("20 full-batch epochs match the reference", () => {
    let net = initMlp([2, 3, 1], "tanh", 1);
    for (let e = 0; e < 20; e++) net = trainEpoch(net, X, Y, 0.5).net;
    closeNested(net.W, fixtures.tanh.after20.W);
    closeNested(net.b, fixtures.tanh.after20.b);
  });

  it("reports one gradient size per layer and never produces NaN, even with a huge learning rate", () => {
    let net = initMlp([2, 8, 8, 1], "relu", 4);
    for (let e = 0; e < 30; e++) {
      const r = trainEpoch(net, X, Y, 50);
      expect(r.gradNorms).toHaveLength(3);
      expect(Number.isNaN(r.loss)).toBe(false);
      net = r.net;
    }
  });
});
