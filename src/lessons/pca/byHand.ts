import { fmt, mean, sum, type HandExample } from "../shared/hand";
import { PAPER_POINTS } from "./paper";

/** Four 2-D points: centre them, build the covariance matrix, find its eigenvalues, project onto PC1. */
export function pcaByHand(): HandExample {
  const pts = PAPER_POINTS;
  const n = pts.length;
  const mx = mean(pts.map((p) => p[0]));
  const my = mean(pts.map((p) => p[1]));
  const c = pts.map((p) => [p[0] - mx, p[1] - my]);
  const sxx = sum(c.map((p) => p[0] * p[0]));
  const syy = sum(c.map((p) => p[1] * p[1]));
  const sxy = sum(c.map((p) => p[0] * p[1]));
  // Divide by n, as the Lab does; n − 1 would scale every variance alike and change neither the direction nor the % kept.
  const a = sxx / n;
  const d = syy / n;
  const bc = sxy / n;
  // Eigenvalues of [[a, b], [b, d]]: λ = (a + d)/2 ± √(((a − d)/2)² + b²)
  const mid = (a + d) / 2;
  const rad = Math.sqrt(((a - d) / 2) ** 2 + bc ** 2);
  const l1 = mid + rad;
  const l2 = mid - rad;
  // Eigenvector for λ1: (b, λ1 − a), normalised.
  const vx = bc;
  const vy = l1 - a;
  const vn = Math.hypot(vx, vy);
  const v = [vx / vn, vy / vn];
  const z = c.map((p) => p[0] * v[0] + p[1] * v[1]);

  return {
    given: [{ table: { headers: ["{point}", "x", "y"], rows: pts.map((p, i) => [`P${i + 1}`, fmt(p[0]), fmt(p[1])]) } }],
    vars: {},
    steps: [
      {
        id: "centre",
        vars: { mx: fmt(mx), my: fmt(my) },
        blocks: [
          { math: [`x̄ = (${pts.map((p) => p[0]).join(" + ")}) / ${n} = ${fmt(mx)}    ȳ = (${pts.map((p) => p[1]).join(" + ")}) / ${n} = ${fmt(my)}`] },
          {
            table: {
              headers: ["{point}", "x − x̄", "y − ȳ", "(x − x̄)²", "(y − ȳ)²", "(x − x̄)(y − ȳ)"],
              rows: c.map((p, i) => [`P${i + 1}`, fmt(p[0]), fmt(p[1]), fmt(p[0] ** 2), fmt(p[1] ** 2), fmt(p[0] * p[1])]),
              foot: ["Σ", "", "", fmt(sxx), fmt(syy), fmt(sxy)],
            },
          },
        ],
      },
      {
        id: "covariance",
        vars: { varX: fmt(a), varY: fmt(d), cov: fmt(bc) },
        blocks: [
          {
            math: [
              `var(x) = ${fmt(sxx)} / ${n} = ${fmt(a)}    var(y) = ${fmt(syy)} / ${n} = ${fmt(d)}    cov(x, y) = ${fmt(sxy)} / ${n} = ${fmt(bc)}`,
              `Σ = [ ${fmt(a)}  ${fmt(bc)} ; ${fmt(bc)}  ${fmt(d)} ]`,
            ],
          },
        ],
      },
      {
        id: "eigen",
        vars: { l1: fmt(l1), l2: fmt(l2) },
        blocks: [
          {
            math: [
              `det(Σ − λI) = (${fmt(a)} − λ)(${fmt(d)} − λ) − ${fmt(bc)}² = 0`,
              `λ = ${fmt(mid)} ± ${fmt(rad)}`,
              `λ1 = ${fmt(l1)}    λ2 = ${fmt(l2)}`,
            ],
          },
        ],
      },
      {
        id: "vector",
        vars: { v: `(${fmt(v[0])}, ${fmt(v[1])})` },
        blocks: [{ math: [`(Σ − λ1 I) v = 0  ⇒  v ∝ (${fmt(vx)}, ${fmt(vy)})`, `v1 = (${fmt(v[0])}, ${fmt(v[1])})`] }],
      },
      {
        id: "project",
        blocks: [
          { math: [`z = v1 · (x − x̄, y − ȳ)`] },
          { table: { headers: ["{point}", "x − x̄", "y − ȳ", "z"], rows: c.map((p, i) => [`P${i + 1}`, fmt(p[0]), fmt(p[1]), fmt(z[i])]) } },
        ],
      },
      {
        id: "explained",
        vars: { kept: fmt((100 * l1) / (l1 + l2), 1) },
        blocks: [{ math: [`λ1 / (λ1 + λ2) = ${fmt(l1)} / (${fmt(l1)} + ${fmt(l2)}) = ${fmt((100 * l1) / (l1 + l2), 1)}%`] }],
      },
    ],
  };
}
