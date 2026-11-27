import { fmt, term, type HandExample } from "../shared/hand";

/** A 2-2-1 network with given weights: one forward pass, ReLU in the hidden layer, sigmoid at the end. */
export function neuralNetworkByHand(): HandExample {
  const x = [1, 2];
  const hidden = [
    { w: [0.5, 1], b: -1 },
    { w: [-2, 0.5], b: 0 },
  ];
  const out = { w: [2, -1], b: 0.5 };
  const z = hidden.map((n) => n.w[0] * x[0] + n.w[1] * x[1] + n.b);
  const h = z.map((v) => Math.max(0, v));
  const zo = out.w[0] * h[0] + out.w[1] * h[1] + out.b;
  const y = 1 / (1 + Math.exp(-zo));
  const lin = (w: number[], b: number, v: number[]) => `${fmt(w[0])} · ${term(v[0])} + ${term(w[1])} · ${term(v[1])} + ${term(b)}`;

  return {
    given: [
      { math: [`x = (${x.join(", ")})`] },
      {
        table: {
          headers: ["{neuron}", "w1", "w2", "b"],
          rows: [
            ["h1", fmt(hidden[0].w[0]), fmt(hidden[0].w[1]), fmt(hidden[0].b)],
            ["h2", fmt(hidden[1].w[0]), fmt(hidden[1].w[1]), fmt(hidden[1].b)],
            ["ŷ", fmt(out.w[0]), fmt(out.w[1]), fmt(out.b)],
          ],
        },
      },
    ],
    vars: {},
    steps: [
      {
        id: "sums",
        vars: { z1: fmt(z[0]), z2: fmt(z[1]) },
        blocks: [{ math: [`z1 = ${lin(hidden[0].w, hidden[0].b, x)} = ${fmt(z[0])}`, `z2 = ${lin(hidden[1].w, hidden[1].b, x)} = ${fmt(z[1])}`] }],
      },
      {
        id: "relu",
        vars: { h1: fmt(h[0]), h2: fmt(h[1]) },
        blocks: [{ math: ["ReLU(z) = max(0, z)", `h1 = max(0, ${fmt(z[0])}) = ${fmt(h[0])}`, `h2 = max(0, ${fmt(z[1])}) = ${fmt(h[1])}`] }],
      },
      {
        id: "output",
        vars: { z: fmt(zo) },
        blocks: [{ math: [`z = ${lin(out.w, out.b, h)} = ${fmt(zo)}`] }],
      },
      {
        id: "sigmoid",
        vars: { out: fmt(y) },
        blocks: [{ math: [`ŷ = σ(z) = 1 / (1 + e^(−${fmt(zo)})) = 1 / (1 + ${fmt(Math.exp(-zo), 3)}) = ${fmt(y)}`] }],
      },
    ],
  };
}
