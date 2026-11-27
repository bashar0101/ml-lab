import { fmt, mean, type HandExample } from "../shared/hand";

/** Hours studied → pass or fail, with a model already trained: p = σ(2x − 5). */
export function logisticRegressionByHand(): HandExample {
  const w = 2;
  const b = -5;
  const hours = [1, 2, 3, 4];
  const passed = [false, false, true, true];
  const z = hours.map((x) => w * x + b);
  const e = z.map((v) => Math.exp(-v));
  const p = e.map((v) => 1 / (1 + v));
  const lossEach = p.map((v, i) => -Math.log(passed[i] ? v : 1 - v));
  const boundary = -b / w;
  const word = (pass: boolean) => (pass ? "{pass}" : "{fail}");

  return {
    given: [
      { table: { headers: ["{hours} x", "{result} y"], rows: hours.map((x, i) => [fmt(x), word(passed[i])]) } },
      { math: [`p = σ(z) = 1 / (1 + e^(−z))`, `z = ${w}x − ${-b}`] },
    ],
    vars: { w: fmt(w), b: fmt(b) },
    steps: [
      {
        id: "score",
        blocks: [
          { math: [`z = ${w} · ${hours[0]} − ${-b} = ${fmt(z[0])}`] },
          { table: { headers: ["x", "z = 2x − 5"], rows: hours.map((x, i) => [fmt(x), fmt(z[i])]) } },
        ],
      },
      {
        id: "sigmoid",
        vars: { p1: fmt(p[0]), p4: fmt(p[3]) },
        blocks: [
          { math: [`p = 1 / (1 + e^(−(${fmt(z[0])}))) = 1 / (1 + ${fmt(e[0])}) = ${fmt(p[0])}`] },
          {
            table: {
              headers: ["x", "z", "e^(−z)", "1 + e^(−z)", "p"],
              rows: hours.map((x, i) => [fmt(x), fmt(z[i]), fmt(e[i]), fmt(1 + e[i]), fmt(p[i])]),
            },
          },
        ],
      },
      {
        id: "decide",
        blocks: [
          {
            table: {
              headers: ["x", "p", "p ≥ 0.5 ?", "{prediction}", "{result} y"],
              rows: hours.map((x, i) => [fmt(x), fmt(p[i]), p[i] >= 0.5 ? "✓" : "✗", word(p[i] >= 0.5), word(passed[i])]),
            },
          },
        ],
      },
      {
        id: "loss",
        vars: { loss: fmt(mean(lossEach)) },
        blocks: [
          { math: [`{pass}: −ln(p)     {fail}: −ln(1 − p)`] },
          {
            table: {
              headers: ["x", "y", "p", "{logLoss}"],
              rows: hours.map((x, i) => [fmt(x), word(passed[i]), fmt(p[i]), `${passed[i] ? `−ln(${fmt(p[i])})` : `−ln(1 − ${fmt(p[i])})`} = ${fmt(lossEach[i])}`]),
              foot: ["", "", "{average}", fmt(mean(lossEach))],
            },
          },
        ],
      },
      {
        id: "boundary",
        vars: { boundary: fmt(boundary) },
        blocks: [{ math: [`p = 0.5  ⇔  z = 0  ⇔  ${w}x − ${-b} = 0  ⇔  x = ${fmt(boundary)}`] }],
      },
    ],
  };
}
