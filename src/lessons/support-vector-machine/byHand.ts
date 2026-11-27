import { fmt, MINUS, type HandExample } from "../shared/hand";
import { PAPER_B, PAPER_POINTS, PAPER_W } from "./paper";

/** A trained linear SVM, w = (1, 1) and b = −5: check the margins, measure the street, classify. */
export function supportVectorMachineByHand(): HandExample {
  const w = PAPER_W;
  const b = PAPER_B;
  const pts = PAPER_POINTS;
  const f = (x: number[]) => w[0] * x[0] + w[1] * x[1] + b;
  const rows = pts.map((p) => ({ ...p, f: f(p.x), yf: p.y * f(p.x) }));
  const supports = rows.filter((r) => Math.abs(r.yf - 1) < 1e-9);
  const norm = Math.hypot(w[0], w[1]);
  const width = 2 / norm;
  const q = [5, 2];
  const score = f(q);
  const sign = (v: number) => (v > 0 ? "+1" : `${MINUS}1`);
  const pt = (x: number[]) => `(${x.join(", ")})`;

  return {
    given: [
      { table: { headers: ["x1", "x2", "y"], rows: pts.map((p) => [fmt(p.x[0]), fmt(p.x[1]), sign(p.y)]) } },
      { math: [`w = (${w.join(", ")})    b = ${fmt(b)}`, `f(x) = w · x + b = x1 + x2 − ${-b}`] },
    ],
    vars: { b: fmt(b), qx: pt(q) },
    steps: [
      {
        id: "score",
        blocks: [
          { math: [`f${pt(pts[0].x)} = ${w[0]} · ${pts[0].x[0]} + ${w[1]} · ${pts[0].x[1]} ${fmt(b)} = ${fmt(rows[0].f)}`] },
          {
            table: {
              headers: ["x", "y", "f(x)", "y · f(x)"],
              rows: rows.map((r) => [pt(r.x), sign(r.y), fmt(r.f), fmt(r.yf)]),
              mark: rows.map((r, i) => (supports.includes(r) ? i : -1)).filter((i) => i >= 0),
            },
          },
        ],
      },
      {
        id: "supports",
        vars: { supports: String(supports.length), supportList: supports.map((r) => pt(r.x)).join(", ") },
        blocks: [{ math: [`y · f(x) ≥ 1`, `y · f(x) = 1  ⇒  ${supports.map((r) => pt(r.x)).join(", ")}`] }],
      },
      {
        id: "width",
        vars: { width: fmt(width) },
        blocks: [{ math: [`‖w‖ = √(${w[0]}² + ${w[1]}²) = ${fmt(norm)}`, `2 / ‖w‖ = 2 / ${fmt(norm)} = ${fmt(width)}`] }],
      },
      {
        id: "hinge",
        blocks: [
          { math: ["max(0, 1 − y · f(x))"] },
          { table: { headers: ["x", "y · f(x)", "max(0, 1 − y · f(x))"], rows: rows.map((r) => [pt(r.x), fmt(r.yf), fmt(Math.max(0, 1 - r.yf))]) } },
        ],
      },
      {
        id: "classify",
        vars: { score: fmt(score), winner: sign(score) },
        blocks: [{ math: [`f${pt(q)} = ${q[0]} + ${q[1]} − ${-b} = ${fmt(score)}  ⇒  ${sign(score)}`] }],
      },
    ],
  };
}

