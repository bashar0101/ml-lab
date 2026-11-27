import { fmt, type HandExample } from "../shared/hand";
import { PAPER_K, PAPER_POINTS, PAPER_QUERY } from "./paper";

/** Nine labelled points and a new one at (7, 6); classify it with k = 3 and Euclidean distance. */
export function kNearestNeighborsByHand(): HandExample {
  const pts = PAPER_POINTS;
  const q = { x1: PAPER_QUERY.x, x2: PAPER_QUERY.y };
  const k = PAPER_K;
  const rows = pts.map((p, i) => {
    const a = (p.x1 - q.x1) ** 2;
    const b = (p.x2 - q.x2) ** 2;
    return { i, p, a, b, d: Math.sqrt(a + b) };
  });
  // A stable sort keeps the table order among equal distances, which the text explains.
  const ranked = [...rows].sort((r, s) => r.d - s.d);
  const rank = new Map(ranked.map((r, n) => [r.i, n + 1]));
  const nearest = ranked.slice(0, k);
  const good = nearest.filter((r) => r.p.label === "good").length;
  const bad = k - good;
  const first = rows[0];

  return {
    given: [
      {
        table: {
          headers: ["X1", "X2", "{quality}"],
          rows: pts.map((p) => [fmt(p.x1), fmt(p.x2), `{${p.label}}`]),
        },
      },
    ],
    vars: { k: String(k), qx: fmt(q.x1), qy: fmt(q.x2) },
    steps: [
      {
        id: "formula",
        vars: { firstD: fmt(first.d) },
        blocks: [
          {
            math: [
              `d(X*, X) = √((x1 − ${fmt(q.x1)})² + (x2 − ${fmt(q.x2)})²)`,
              `d = √((${fmt(first.p.x1)} − ${fmt(q.x1)})² + (${fmt(first.p.x2)} − ${fmt(q.x2)})²) = √(${fmt(first.a)} + ${fmt(first.b)}) = √${fmt(first.a + first.b)} = ${fmt(first.d)}`,
            ],
          },
        ],
      },
      {
        id: "distances",
        blocks: [
          {
            table: {
              headers: ["X1", "X2", "{quality}", `(x1 − ${fmt(q.x1)})²`, `(x2 − ${fmt(q.x2)})²`, "d", "{rank}"],
              rows: rows.map((r) => [fmt(r.p.x1), fmt(r.p.x2), `{${r.p.label}}`, fmt(r.a), fmt(r.b), fmt(r.d), String(rank.get(r.i))]),
            },
          },
        ],
      },
      {
        id: "nearest",
        vars: { d1: fmt(nearest[0].d), d2: fmt(nearest[1].d), d3: fmt(nearest[2].d) },
        blocks: [
          {
            table: {
              headers: ["{rank}", "X1", "X2", "d", "{quality}"],
              rows: ranked.slice(0, k + 1).map((r, n) => [String(n + 1), fmt(r.p.x1), fmt(r.p.x2), fmt(r.d), `{${r.p.label}}`]),
              mark: nearest.map((_, n) => n),
            },
          },
        ],
      },
      {
        id: "vote",
        vars: { goodVotes: String(good), badVotes: String(bad), winner: good > bad ? "{good}" : "{bad}" },
        blocks: [{ math: [`{good}: ${good}   {bad}: ${bad}`, `${good} > ${bad}  ⇒  X*(${fmt(q.x1)}, ${fmt(q.x2)}) = ${good > bad ? "{good}" : "{bad}"}`] }],
      },
    ],
  };
}

