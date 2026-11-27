import { fmt, term, type HandExample } from "../shared/hand";
import { PAPER_LR, PAPER_START, PAPER_TARGET } from "./paper";

/** Minimise L(w) = (w − 3)² from w = 0 with learning rate 0.25, three steps. */
export function gradientDescentByHand(): HandExample {
  const target = PAPER_TARGET;
  const lr = PAPER_LR;
  const steps = 3;
  const ws = [PAPER_START];
  for (let t = 0; t < steps; t++) {
    const w = ws[t];
    ws.push(w - lr * 2 * (w - target));
  }
  const loss = (w: number) => (w - target) ** 2;
  const grad = (w: number) => 2 * (w - target);
  const w0 = ws[0];

  return {
    given: [{ math: [`L(w) = (w − ${target})²`, `w₀ = ${fmt(w0)}    η = ${fmt(lr)}`] }],
    vars: { target: fmt(target), lr: fmt(lr), w0: fmt(w0), steps: String(steps) },
    steps: [
      {
        id: "derivative",
        blocks: [{ math: [`dL/dw = 2(w − ${target})`, `dL/dw (w = ${fmt(w0)}) = 2(${fmt(w0)} − ${target}) = ${fmt(grad(w0))}`] }],
      },
      {
        id: "rule",
        vars: { w1: fmt(ws[1], 4) },
        blocks: [
          {
            math: [
              `w ← w − η · dL/dw`,
              `w₁ = ${fmt(w0)} − ${fmt(lr)} · ${term(grad(w0))} = ${fmt(w0)} + ${fmt(-lr * grad(w0), 4)} = ${fmt(ws[1], 4)}`,
            ],
          },
        ],
      },
      {
        id: "repeat",
        vars: { w2: fmt(ws[2], 4), w3: fmt(ws[3], 4) },
        blocks: [
          {
            table: {
              headers: ["t", "w", "L(w)", "dL/dw", "η · dL/dw", "w − η · dL/dw"],
              rows: ws.slice(0, steps).map((w, t) => [String(t), fmt(w, 4), fmt(loss(w), 4), fmt(grad(w), 4), fmt(lr * grad(w), 4), fmt(ws[t + 1], 4)]),
            },
          },
        ],
      },
      {
        id: "converge",
        vars: { lossEnd: fmt(loss(ws[steps]), 4), gap: fmt(target - ws[steps], 4) },
        blocks: [
          {
            math: [
              `${target} − w:  ${ws.map((w) => fmt(target - w, 4)).join("  →  ")}`,
              `L(w):  ${ws.map((w) => fmt(loss(w), 4)).join("  →  ")}`,
            ],
          },
        ],
      },
    ],
  };
}
