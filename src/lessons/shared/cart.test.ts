import { describe, expect, it } from "vitest";
import fixtures from "../decision-tree/fixtures.json";
import { bestSplit, gini, growTree, predictTree } from "./cart";
import { makeDataset, type LabeledPoint } from "./datasets2d";

const toPts = (raw: number[][]): LabeledPoint[] => raw.map(([x, y, c]) => ({ x, y, c: c as 0 | 1 | 2 }));
const shape = (nodes: ReturnType<typeof growTree>) =>
  nodes.map((n) => ({ depth: n.depth, counts: n.counts, split: n.split ? [n.split.feature, n.split.threshold] : null }));

describe("gini", () => {
  it("is 0 for pure nodes and 0.5 for an even two-class split", () => {
    expect(gini([5, 0])).toBe(0);
    expect(gini([3, 3])).toBe(0.5);
    expect(gini([])).toBe(0);
  });
});

describe("growTree", () => {
  it.each([
    ["two classes, depth 3", fixtures.two.points, fixtures.two.depth3, { maxDepth: 3, minLeaf: 1 }],
    ["two classes, depth 1", fixtures.two.points, fixtures.two.depth1, { maxDepth: 1, minLeaf: 1 }],
    ["two classes, min leaf 4", fixtures.two.points, fixtures.two.minLeaf4, { maxDepth: 5, minLeaf: 4 }],
    ["three classes, depth 3", fixtures.three.points, fixtures.three.depth3, { maxDepth: 3, minLeaf: 1 }],
  ])("matches the NumPy reference: %s", (_n, raw, expected, opts) => {
    expect(shape(growTree(toPts(raw), opts))).toEqual(expected);
  });

  it("grows breadth-first: depths never decrease along the node list", () => {
    const nodes = growTree(makeDataset("overlap"), { maxDepth: 5, minLeaf: 1 });
    for (let i = 1; i < nodes.length; i++) expect(nodes[i].depth).toBeGreaterThanOrEqual(nodes[i - 1].depth);
  });

  it("identical points with mixed classes stop as a single leaf", () => {
    const same: LabeledPoint[] = [
      { x: 3, y: 3, c: 0 },
      { x: 3, y: 3, c: 1 },
      { x: 3, y: 3, c: 0 },
    ];
    const nodes = growTree(same, { maxDepth: 8, minLeaf: 1 });
    expect(nodes).toHaveLength(1);
    expect(nodes[0].prediction).toBe(0);
  });

  it("a deep tree with min leaf 1 memorises every training point", () => {
    const pts = makeDataset("overlap");
    const nodes = growTree(pts, { maxDepth: 12, minLeaf: 1 });
    expect(pts.every((p) => predictTree(nodes, p.x, p.y) === p.c)).toBe(true);
  });

  it("respects min leaf and gives every child a box inside its parent", () => {
    const nodes = growTree(makeDataset("moons"), { maxDepth: 6, minLeaf: 5 });
    for (const n of nodes) {
      if (n.split) expect(n.indices.length).toBeGreaterThanOrEqual(10);
      else expect(n.indices.length).toBeGreaterThanOrEqual(5);
      if (n.left !== undefined) {
        const l = nodes[n.left].box;
        expect(l.x[0]).toBeGreaterThanOrEqual(n.box.x[0]);
        expect(l.x[1]).toBeLessThanOrEqual(n.box.x[1]);
      }
    }
  });

  it("the feature hook restricts which features may split (random forests)", () => {
    const nodes = growTree(makeDataset("blobs"), { maxDepth: 3, minLeaf: 1, features: () => [1] });
    for (const n of nodes) if (n.split) expect(n.split.feature).toBe(1);
  });

  it("reports scan, split and leaf events in order", () => {
    const events: string[] = [];
    growTree(toPts(fixtures.two.points), { maxDepth: 1, minLeaf: 1 }, (e) => events.push(e.kind));
    expect(events).toEqual(["scan", "split", "leaf", "leaf"]);
  });
});

describe("bestSplit", () => {
  it("returns the best candidate per feature for the scan view", () => {
    const pts = toPts(fixtures.two.points);
    const r = bestSplit(pts, pts.map((_, i) => i), [0, 1], 1)!;
    expect(r.best).toMatchObject({ feature: 1, threshold: 4.65 });
    expect(r.perFeature.map((c) => c.feature)).toEqual([0, 1]);
    expect(r.best.gain).toBeCloseTo(0.5, 12);
  });
});
