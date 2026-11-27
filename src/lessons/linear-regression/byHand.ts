import { fmt, mean, sum, term, type HandExample } from "../shared/hand";
import { PAPER_AGES, PAPER_PRICES } from "./paper";

/** Car age (years) against price: fit y = m·x + b with the closed-form least-squares formulas. */
export function linearRegressionByHand(): HandExample {
  const x = PAPER_AGES;
  const y = PAPER_PRICES;
  const xm = mean(x);
  const ym = mean(y);
  const dx = x.map((v) => v - xm);
  const dy = y.map((v) => v - ym);
  const prod = dx.map((v, i) => v * dy[i]);
  const sq = dx.map((v) => v * v);
  const sxy = sum(prod);
  const sxx = sum(sq);
  const m = sxy / sxx;
  const b = ym - m * xm;
  const newX = 4;
  const pred = m * newX + b;

  return {
    given: [{ table: { headers: ["{age} x", "{price} y"], rows: x.map((v, i) => [fmt(v), fmt(y[i])]) } }],
    vars: { newX: fmt(newX) },
    steps: [
      {
        id: "means",
        vars: { xMean: fmt(xm), yMean: fmt(ym) },
        blocks: [
          {
            math: [
              `x̄ = (${x.join(" + ")}) / ${x.length} = ${fmt(sum(x))} / ${x.length} = ${fmt(xm)}`,
              `ȳ = (${y.join(" + ")}) / ${y.length} = ${fmt(sum(y))} / ${y.length} = ${fmt(ym)}`,
            ],
          },
        ],
      },
      {
        id: "table",
        vars: { sxy: fmt(sxy), sxx: fmt(sxx) },
        blocks: [
          {
            table: {
              headers: ["x", "y", "x − x̄", "y − ȳ", "(x − x̄)(y − ȳ)", "(x − x̄)²"],
              rows: x.map((v, i) => [fmt(v), fmt(y[i]), fmt(dx[i]), fmt(dy[i]), fmt(prod[i]), fmt(sq[i])]),
              foot: ["Σ", "", "", "", fmt(sxy), fmt(sxx)],
            },
          },
        ],
      },
      {
        id: "slope",
        vars: { slope: fmt(m) },
        blocks: [{ math: [`m = Σ(x − x̄)(y − ȳ) / Σ(x − x̄)²`, `m = ${fmt(sxy)} / ${fmt(sxx)} = ${fmt(m)}`] }],
      },
      {
        id: "intercept",
        vars: { intercept: fmt(b) },
        blocks: [
          {
            math: [`b = ȳ − m · x̄`, `b = ${fmt(ym)} − ${term(m)} · ${fmt(xm)} = ${fmt(ym)} + ${fmt(-m * xm)} = ${fmt(b)}`, `ŷ = ${fmt(m)}x + ${fmt(b)}`],
          },
        ],
      },
      {
        id: "predict",
        vars: { prediction: fmt(pred) },
        blocks: [{ math: [`ŷ = ${fmt(m)} · ${fmt(newX)} + ${fmt(b)} = ${fmt(m * newX)} + ${fmt(b)} = ${fmt(pred)}`] }],
      },
    ],
  };
}
