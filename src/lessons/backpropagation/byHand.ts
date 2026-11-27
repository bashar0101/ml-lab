import { fmt, type HandExample } from "../shared/hand";

/** x → h = ReLU(w1·x) → ŷ = w2·h, loss ½(ŷ − y)²: forward, chain rule backwards, one update. */
export function backpropagationByHand(): HandExample {
  const x = 2;
  const y = 1;
  let w1 = 0.5;
  let w2 = 1.5;
  const lr = 0.1;
  const forward = (a: number, b: number) => {
    const h = Math.max(0, a * x);
    const yhat = b * h;
    return { h, yhat, loss: 0.5 * (yhat - y) ** 2 };
  };
  const f = forward(w1, w2);
  const dy = f.yhat - y;
  const gw2 = dy * f.h;
  const dh = dy * w2;
  const relu = f.h > 0 ? 1 : 0;
  const gw1 = dh * relu * x;
  const old = { w1, w2 };
  w1 -= lr * gw1;
  w2 -= lr * gw2;
  const g = forward(w1, w2);

  return {
    given: [{ math: [`x = ${x}    y = ${y}    w1 = ${fmt(old.w1)}    w2 = ${fmt(old.w2)}    η = ${fmt(lr)}`, "h = ReLU(w1 · x)    ŷ = w2 · h    L = ½(ŷ − y)²"] }],
    vars: { lr: fmt(lr) },
    steps: [
      {
        id: "forward",
        vars: { h: fmt(f.h), yhat: fmt(f.yhat), loss: fmt(f.loss, 4) },
        blocks: [
          {
            math: [
              `h = ReLU(${fmt(old.w1)} · ${x}) = ${fmt(f.h)}`,
              `ŷ = ${fmt(old.w2)} · ${fmt(f.h)} = ${fmt(f.yhat)}`,
              `L = ½(${fmt(f.yhat)} − ${y})² = ${fmt(f.loss, 4)}`,
            ],
          },
        ],
      },
      {
        id: "output",
        vars: { dy: fmt(dy), gw2: fmt(gw2) },
        blocks: [{ math: [`∂L/∂ŷ = ŷ − y = ${fmt(dy)}`, `∂L/∂w2 = ∂L/∂ŷ · h = ${fmt(dy)} · ${fmt(f.h)} = ${fmt(gw2)}`] }],
      },
      {
        id: "hidden",
        vars: { dh: fmt(dh), gw1: fmt(gw1) },
        blocks: [
          {
            math: [
              `∂L/∂h = ∂L/∂ŷ · w2 = ${fmt(dy)} · ${fmt(old.w2)} = ${fmt(dh)}`,
              `ReLU′(${fmt(f.h)}) = ${relu}`,
              `∂L/∂w1 = ∂L/∂h · ReLU′ · x = ${fmt(dh)} · ${relu} · ${x} = ${fmt(gw1)}`,
            ],
          },
        ],
      },
      {
        id: "update",
        vars: { w1new: fmt(w1), w2new: fmt(w2) },
        blocks: [
          {
            math: [
              `w1 = ${fmt(old.w1)} − ${fmt(lr)} · ${fmt(gw1)} = ${fmt(w1)}`,
              `w2 = ${fmt(old.w2)} − ${fmt(lr)} · ${fmt(gw2)} = ${fmt(w2)}`,
            ],
          },
        ],
      },
      {
        id: "check",
        vars: { yhatNew: fmt(g.yhat, 3), lossNew: fmt(g.loss, 4) },
        blocks: [
          {
            math: [
              `h = ${fmt(w1)} · ${x} = ${fmt(g.h)}    ŷ = ${fmt(w2)} · ${fmt(g.h)} = ${fmt(g.yhat, 3)}`,
              `L = ½(${fmt(g.yhat, 3)} − ${y})² ≈ ${fmt(g.loss, 4)}`,
            ],
          },
        ],
      },
    ],
  };
}
