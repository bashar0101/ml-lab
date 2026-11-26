import { capFrames } from "@/engine/cap";
import { mulberry32 } from "@/engine/random";
import type { Frame, Trace } from "@/engine/types";
import { growTree, predictTree, type TreeNode } from "../shared/cart";
import type { LabeledPoint } from "../shared/datasets2d";

export interface ForestParams {
  trees: number;
  maxDepth: number;
  seed: number;
}

export interface ForestTree {
  /** Indices of the original points drawn for this tree (with repeats). */
  sample: number[];
  nodes: TreeNode[];
}

export interface ForestState {
  /** 1-based number of the tree being shown; 0 before the first. */
  tree: number;
  /** How many times each original point was drawn for the current tree. */
  counts: number[];
  /** Every finished tree so far. */
  trees: ForestTree[];
}

export const FOREST_DEFAULTS: ForestParams = { trees: 15, maxDepth: 4, seed: 1 };
export const FOREST_LIMITS = { trees: { min: 1, max: 50 }, maxDepth: { min: 1, max: 8 } } as const;
const MAX_FRAMES = 2000;

export function validateForest(points: LabeledPoint[]): "tooFew" | "oneClass" | null {
  if (points.length < 4) return "tooFew";
  if (new Set(points.map((p) => p.c)).size < 2) return "oneClass";
  return null;
}

export function forestVotes(trees: ForestTree[], x: number, y: number): { votes: number[]; share: number; prediction: 0 | 1 | 2 } {
  const classes = Math.max(2, ...trees.map((t) => t.nodes[0].counts.length));
  const votes = Array.from({ length: classes }, () => 0);
  for (const t of trees) votes[predictTree(t.nodes, x, y)]++;
  const top = Math.max(...votes);
  return { votes, share: trees.length ? votes[1] / trees.length : 0.5, prediction: votes.indexOf(top) as 0 | 1 | 2 };
}

export function runForest(points: LabeledPoint[], p: ForestParams): Trace<ForestState> {
  const err = validateForest(points);
  if (err) throw new Error(`Invalid data: ${err}`);
  const n = points.length;
  const rand = mulberry32(p.seed);
  const trees: ForestTree[] = [];
  const frames: Frame<ForestState>[] = [];

  const metrics = (built: ForestTree[], tree: number) => {
    const accuracy = built.length ? points.filter((q) => forestVotes(built, q.x, q.y).prediction === q.c).length / n : 0;
    // Out-of-bag: each point is judged only by the trees that never saw it.
    let judged = 0;
    let right = 0;
    points.forEach((q, i) => {
      const unseen = built.filter((t) => !t.sample.includes(i));
      if (!unseen.length) return;
      judged++;
      if (forestVotes(unseen, q.x, q.y).prediction === q.c) right++;
    });
    return { tree, trees: built.length, accuracy, oob: judged ? right / judged : Number.NaN };
  };
  const push = (tree: number, counts: number[], codeLine: string, event: string, tags: string[] = []) => {
    const built = trees.slice();
    frames.push({ state: { tree, counts, trees: built }, codeLine, event, tags, metrics: metrics(built, tree) });
  };

  push(0, points.map(() => 1), "init", "init", ["start"]);
  for (let k = 1; k <= p.trees; k++) {
    const sample = Array.from({ length: n }, () => Math.floor(rand() * n));
    const counts = points.map(() => 0);
    for (const i of sample) counts[i]++;
    push(k, counts, "sample", "sample", k === 1 ? ["first-sample"] : []);
    const nodes = growTree(
      sample.map((i) => points[i]),
      { maxDepth: p.maxDepth, minLeaf: 1, features: () => [rand() < 0.5 ? 0 : 1] },
    );
    trees.push({ sample, nodes });
    push(k, counts, "grow", "grow", k === 1 ? ["first-tree"] : []);
    push(k, counts, "vote", "vote", k === 5 ? ["five-trees"] : []);
  }
  push(p.trees, points.map(() => 1), "return", "done", ["done"]);
  const capped = capFrames(frames, MAX_FRAMES);
  return { frames: capped.frames, meta: { algorithm: "random-forest", seed: p.seed, truncated: capped.truncated } };
}
