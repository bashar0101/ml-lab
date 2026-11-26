import type { Frame, Trace } from "@/engine/types";
import { growTree, predictTree, type Candidate, type TreeNode } from "../shared/cart";
import type { LabeledPoint } from "../shared/datasets2d";

export interface TreeParams {
  maxDepth: number;
  minLeaf: number;
}

export interface TreeState {
  /** Every node created so far (a snapshot). */
  nodes: TreeNode[];
  /** The node being looked at, if any. */
  current: number | null;
  /** On scan frames: the best question for each feature. */
  candidates: Candidate[];
}

export const TREE_DEFAULTS: TreeParams = { maxDepth: 3, minLeaf: 2 };
export const TREE_LIMITS = { maxDepth: { min: 1, max: 8 }, minLeaf: { min: 1, max: 10 } } as const;

export function validateTree(points: LabeledPoint[]): "tooFew" | null {
  return points.length < 2 ? "tooFew" : null;
}

const snapshot = (nodes: TreeNode[]): TreeNode[] => nodes.map((n) => ({ ...n, split: n.split ? { ...n.split } : undefined }));

export function runDecisionTree(points: LabeledPoint[], p: TreeParams): Trace<TreeState> {
  const err = validateTree(points);
  if (err) throw new Error(`Invalid data: ${err}`);
  const frames: Frame<TreeState>[] = [];

  const metrics = (nodes: TreeNode[]) => ({
    nodes: nodes.length,
    depth: Math.max(...nodes.map((n) => n.depth)),
    leaves: nodes.filter((n) => !n.split).length,
    accuracy: points.filter((q) => predictTree(nodes, q.x, q.y) === q.c).length / points.length,
  });
  const push = (live: TreeNode[], codeLine: string, event: string, current: number | null, candidates: Candidate[], tags: string[] = []) => {
    const nodes = snapshot(live);
    frames.push({ state: { nodes, current, candidates }, codeLine, event, tags, metrics: metrics(nodes) });
  };

  // The root before any question is asked: a depth-0 tree is just that.
  push(growTree(points, { ...p, maxDepth: 0 }), "init", "init", null, [], ["start"]);

  let firstSplit = true;
  let firstDeepSplit = true;
  const all = growTree(points, p, (e) => {
    if (e.kind === "scan") return push(e.nodes, "scan", "scan", e.node.id, e.candidates);
    if (e.kind === "leaf") return push(e.nodes, "leaf", "leaf", e.node.id, []);
    const tags: string[] = [];
    if (firstSplit) {
      tags.push("first-split");
      firstSplit = false;
    } else if (firstDeepSplit && e.node.depth === 1) {
      tags.push("depth-2");
      firstDeepSplit = false;
    }
    push(e.nodes, "split", "split", e.node.id, [], tags);
  });
  push(all, "return", "done", null, [], ["done"]);
  return { frames, meta: { algorithm: "decision-tree", seed: 0, truncated: false } };
}
