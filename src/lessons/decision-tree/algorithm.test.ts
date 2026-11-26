import { describe, expect, it } from "vitest";
import { frameIndexOfTag } from "@/engine/types";
import { growTree } from "../shared/cart";
import { makeDataset, type LabeledPoint } from "../shared/datasets2d";
import { runDecisionTree, TREE_DEFAULTS, validateTree } from "./algorithm";

describe("runDecisionTree", () => {
  const pts = makeDataset("moons");

  it("ends with exactly the tree growTree builds", () => {
    const t = runDecisionTree(pts, TREE_DEFAULTS);
    const last = t.frames.at(-1)!.state.nodes;
    const ref = growTree(pts, TREE_DEFAULTS);
    expect(last.map((n) => [n.depth, n.counts, n.split?.feature, n.split?.threshold])).toEqual(
      ref.map((n) => [n.depth, n.counts, n.split?.feature, n.split?.threshold]),
    );
  });

  it("records init, then scan/split/leaf events, then done, with the story tags", () => {
    const t = runDecisionTree(pts, TREE_DEFAULTS);
    expect(t.frames[0]).toMatchObject({ event: "init", tags: ["start"] });
    expect(t.frames[1]).toMatchObject({ event: "scan", tags: ["first-scan"] });
    expect(t.frames[2]).toMatchObject({ event: "split", tags: ["first-split"] });
    expect(t.frames.at(-1)).toMatchObject({ event: "done", codeLine: "return", tags: ["done"] });
    expect(frameIndexOfTag(t, "depth-2")).toBeGreaterThan(2);
    for (const f of t.frames) expect(["init", "scan", "split", "leaf", "done"]).toContain(f.event);
  });

  it("later frames never change earlier frames (snapshots, not shared objects)", () => {
    const t = runDecisionTree(pts, TREE_DEFAULTS);
    expect(t.frames[0].state.nodes).toHaveLength(1);
    expect(t.frames[0].state.nodes[0].split).toBeUndefined();
  });

  it("accuracy grows as the tree grows, and a deep tree memorises everything", () => {
    const t = runDecisionTree(pts, TREE_DEFAULTS);
    expect(t.frames.at(-1)!.metrics.accuracy).toBeGreaterThan(t.frames[0].metrics.accuracy);
    const deep = runDecisionTree(makeDataset("overlap"), { maxDepth: 8, minLeaf: 1 });
    expect(deep.frames.at(-1)!.metrics.accuracy).toBe(1);
  });

  it("scan frames carry the best candidate per feature", () => {
    const t = runDecisionTree(pts, TREE_DEFAULTS);
    expect(t.frames[1].state.candidates.map((c) => c.feature)).toEqual([0, 1]);
    expect(t.frames[1].state.current).toBe(0);
  });
});

describe("validateTree", () => {
  it("needs two points", () => {
    expect(validateTree([])).toBe("tooFew");
    expect(validateTree([{ x: 1, y: 1, c: 0 }] as LabeledPoint[])).toBe("tooFew");
    expect(validateTree(makeDataset("blobs"))).toBeNull();
  });
});
