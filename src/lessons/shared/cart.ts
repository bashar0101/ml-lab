import type { LabeledPoint } from "./datasets2d";

export type Feature = 0 | 1;

export interface Candidate {
  feature: Feature;
  threshold: number;
  /** Weighted Gini of the two children. */
  gini: number;
  /** Parent Gini − children Gini. */
  gain: number;
}

export interface TreeNode {
  id: number;
  depth: number;
  indices: number[];
  counts: number[];
  gini: number;
  split?: Candidate;
  left?: number;
  right?: number;
  prediction: 0 | 1 | 2;
  /** The region of the plane this node covers (the 0–10 box, cut by its ancestors). */
  box: { x: [number, number]; y: [number, number] };
}

export interface CartOptions {
  maxDepth: number;
  minLeaf: number;
  /** Which features a node may split on (random forests pick one at random). Default: both. */
  features?: (node: TreeNode) => Feature[];
}

export type CartEvent =
  | { kind: "scan"; node: TreeNode; candidates: Candidate[] }
  | { kind: "split"; node: TreeNode }
  | { kind: "leaf"; node: TreeNode };

const EPS = 1e-12;
const value = (p: LabeledPoint, f: Feature) => (f === 0 ? p.x : p.y);

export function gini(counts: number[]): number {
  const n = counts.reduce((a, c) => a + c, 0);
  if (n === 0) return 0;
  return 1 - counts.reduce((a, c) => a + (c / n) ** 2, 0);
}

function countOf(points: LabeledPoint[], idx: number[], k: number): number[] {
  const out = Array.from({ length: k }, () => 0);
  for (const i of idx) out[points[i].c]++;
  return out;
}

const majority = (counts: number[]) => counts.indexOf(Math.max(...counts)) as 0 | 1 | 2;

/**
 * Best threshold per feature (for the "scan" picture) and overall. Thresholds sit halfway
 * between consecutive distinct values; left = value < threshold. Ties: lower Gini, then
 * feature 0 before 1, then the smaller threshold.
 */
export function bestSplit(
  points: LabeledPoint[],
  idx: number[],
  features: Feature[],
  minLeaf: number,
  k = Math.max(2, ...points.map((p) => p.c + 1)),
): { best: Candidate; perFeature: Candidate[] } | null {
  const n = idx.length;
  const parent = gini(countOf(points, idx, k));
  const perFeature: Candidate[] = [];
  for (const f of [...features].sort()) {
    const values = [...new Set(idx.map((i) => value(points[i], f)))].sort((a, b) => a - b);
    let best: Candidate | null = null;
    for (let v = 0; v + 1 < values.length; v++) {
      const t = (values[v] + values[v + 1]) / 2;
      const left = idx.filter((i) => value(points[i], f) < t);
      const right = idx.filter((i) => value(points[i], f) >= t);
      if (left.length < minLeaf || right.length < minLeaf) continue;
      const w = (left.length * gini(countOf(points, left, k)) + right.length * gini(countOf(points, right, k))) / n;
      if (!best || w < best.gini - EPS) best = { feature: f, threshold: t, gini: w, gain: parent - w };
    }
    if (best) perFeature.push(best);
  }
  if (perFeature.length === 0) return null;
  let best = perFeature[0];
  for (const c of perFeature.slice(1)) if (c.gini < best.gini - EPS) best = c;
  return { best, perFeature };
}

/** Grow a CART tree breadth-first; `onEvent` sees every scan, split and leaf in order. */
export function growTree(points: LabeledPoint[], opts: CartOptions, onEvent?: (e: CartEvent) => void): TreeNode[] {
  const k = Math.max(2, ...points.map((p) => p.c + 1));
  const make = (id: number, depth: number, indices: number[], box: TreeNode["box"]): TreeNode => {
    const counts = countOf(points, indices, k);
    return { id, depth, indices, counts, gini: gini(counts), prediction: majority(counts), box };
  };
  const nodes: TreeNode[] = [make(0, 0, points.map((_, i) => i), { x: [0, 10], y: [0, 10] })];

  for (let q = 0; q < nodes.length; q++) {
    const node = nodes[q];
    const tooSmall = node.indices.length < 2 * opts.minLeaf;
    if (node.depth >= opts.maxDepth || node.gini === 0 || tooSmall) {
      onEvent?.({ kind: "leaf", node });
      continue;
    }
    const features = opts.features?.(node) ?? [0, 1];
    const found = bestSplit(points, node.indices, features, opts.minLeaf, k);
    onEvent?.({ kind: "scan", node, candidates: found?.perFeature ?? [] });
    if (!found || found.best.gain <= EPS) {
      onEvent?.({ kind: "leaf", node });
      continue;
    }
    const { feature: f, threshold: t } = found.best;
    node.split = found.best;
    const leftIdx = node.indices.filter((i) => value(points[i], f) < t);
    const rightIdx = node.indices.filter((i) => value(points[i], f) >= t);
    const lb = { x: [...node.box.x] as [number, number], y: [...node.box.y] as [number, number] };
    const rb = { x: [...node.box.x] as [number, number], y: [...node.box.y] as [number, number] };
    if (f === 0) {
      lb.x[1] = t;
      rb.x[0] = t;
    } else {
      lb.y[1] = t;
      rb.y[0] = t;
    }
    node.left = nodes.length;
    nodes.push(make(nodes.length, node.depth + 1, leftIdx, lb));
    node.right = nodes.length;
    nodes.push(make(nodes.length, node.depth + 1, rightIdx, rb));
    onEvent?.({ kind: "split", node });
  }
  return nodes;
}

export function predictTree(nodes: TreeNode[], x: number, y: number): 0 | 1 | 2 {
  let n = nodes[0];
  while (n.split && n.left !== undefined && n.right !== undefined) {
    const v = n.split.feature === 0 ? x : y;
    n = nodes[v < n.split.threshold ? n.left : n.right];
  }
  return n.prediction;
}
