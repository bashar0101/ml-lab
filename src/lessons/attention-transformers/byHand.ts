import { fmt, sum, type HandExample } from "../shared/hand";

/** Three words with 2-D query/key/value vectors: scaled dot-product attention for the last word. */
export function attentionTransformersByHand(): HandExample {
  const words = ["{w1}", "{w2}", "{w3}"];
  const K = [
    [1, 0],
    [0, 1],
    [1, 1],
  ];
  const V = [
    [1, 0],
    [0, 2],
    [2, 1],
  ];
  const q = [2, 1];
  const d = q.length;
  const vec = (v: number[]) => `(${v.map((x) => fmt(x)).join(", ")})`;
  const dot = K.map((k) => k[0] * q[0] + k[1] * q[1]);
  const scaled = dot.map((s) => s / Math.sqrt(d));
  const ex = scaled.map((s) => Math.exp(s));
  const total = sum(ex);
  const a = ex.map((e) => e / total);
  const out = [0, 1].map((j) => sum(V.map((v, i) => a[i] * v[j])));

  return {
    given: [
      { math: [`q({w3}) = ${vec(q)}    d = ${d}`] },
      { table: { headers: ["{word}", "k", "v"], rows: words.map((w, i) => [w, vec(K[i]), vec(V[i])]) } },
    ],
    vars: {},
    steps: [
      {
        id: "scores",
        blocks: [
          { math: [`q · k = ${q[0]}·${K[0][0]} + ${q[1]}·${K[0][1]} = ${fmt(dot[0])}`] },
          { table: { headers: ["{word}", "q · k"], rows: words.map((w, i) => [w, fmt(dot[i])]) } },
        ],
      },
      {
        id: "scale",
        vars: { root: fmt(Math.sqrt(d)) },
        blocks: [
          { math: [`√d = √${d} = ${fmt(Math.sqrt(d))}`] },
          { table: { headers: ["{word}", "q · k", "q · k / √d"], rows: words.map((w, i) => [w, fmt(dot[i]), fmt(scaled[i])]) } },
        ],
      },
      {
        id: "softmax",
        vars: { a1: fmt(a[0]), a2: fmt(a[1]), a3: fmt(a[2]) },
        blocks: [
          { math: [`softmax(s)_i = e^(s_i) / Σ e^(s_j)`, `Σ e^(s_j) = ${ex.map((e) => fmt(e)).join(" + ")} = ${fmt(total)}`] },
          { table: { headers: ["{word}", "s", "e^s", "{weight}"], rows: words.map((w, i) => [w, fmt(scaled[i]), fmt(ex[i]), fmt(a[i])]), foot: ["Σ", "", fmt(total), fmt(sum(a))] } },
        ],
      },
      {
        id: "mix",
        vars: { out: vec(out) },
        blocks: [
          {
            math: [
              `${a.map((x, i) => `${fmt(x)} · ${vec(V[i])}`).join(" + ")}`,
              `= ${vec(out)}`,
            ],
          },
        ],
      },
    ],
  };
}
