import { fmt, mean, type HandBlock, type HandExample, type HandStep } from "../shared/hand";
import { PAPER_K, PAPER_POINTS } from "./paper";

type P = [number, number];
const pt = (p: P) => `(${fmt(p[0])}, ${fmt(p[1])})`;
const dist = (a: P, b: P) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** Six points, k = 2, starting from two badly placed centres; assign, move, repeat until nothing changes. */
export function kMeansByHand(): HandExample {
  const pts: P[] = PAPER_POINTS.map(([x, y]) => [x, y]);
  // Start from the first k points, as the Lab's "first points" start does.
  let centres: P[] = pts.slice(0, PAPER_K);
  const steps: HandStep[] = [];
  let prev: number[] | null = null;
  let rounds = 0;

  for (let round = 1; round <= 10; round++) {
    const assign = pts.map((p) => (dist(p, centres[0]) <= dist(p, centres[1]) ? 0 : 1));
    const table: HandBlock = {
      table: {
        headers: ["{point}", `d(·, C1)`, `d(·, C2)`, "{cluster}"],
        rows: pts.map((p, i) => [pt(p), fmt(dist(p, centres[0])), fmt(dist(p, centres[1])), `C${assign[i] + 1}`]),
      },
    };
    const same = prev !== null && prev.every((a, i) => a === assign[i]);
    if (same) {
      steps.push({ id: "stop", blocks: [table] });
      break;
    }
    const next = [0, 1].map((c) => {
      const members = pts.filter((_, i) => assign[i] === c);
      return [mean(members.map((m) => m[0])), mean(members.map((m) => m[1]))] as P;
    });
    const formula = [0, 1].map((c) => {
      const members = pts.filter((_, i) => assign[i] === c);
      const xs = members.map((m) => fmt(m[0])).join(" + ");
      const ys = members.map((m) => fmt(m[1])).join(" + ");
      return `C${c + 1} = ((${xs}) / ${members.length}, (${ys}) / ${members.length}) = ${pt(next[c])}`;
    });
    steps.push({ id: `assign${round}`, blocks: [table] });
    steps.push({ id: `update${round}`, vars: { [`c1r${round}`]: pt(next[0]), [`c2r${round}`]: pt(next[1])}, blocks: [{ math: formula }] });
    prev = assign;
    centres = next;
    rounds = round;
  }

  steps[steps.length - 1].vars = { ...steps[steps.length - 1].vars, rounds: String(rounds), c1: pt(centres[0]), c2: pt(centres[1]) };
  return {
    given: [{ table: { headers: ["{point}", "x", "y"], rows: pts.map((p, i) => [`P${i + 1}`, fmt(p[0]), fmt(p[1])]) } }, { math: [`k = ${PAPER_K}`, `C1 = ${pt(pts[0])}    C2 = ${pt(pts[1])}`] }],
    vars: {},
    steps,
  };
}
