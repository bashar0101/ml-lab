import { describe, expect, it } from "vitest";
import { frameIndexOfTag } from "@/engine/types";
import { makeDataset, type LabeledPoint } from "../shared/datasets2d";
import { FOREST_DEFAULTS, forestVotes, runForest, validateForest } from "./algorithm";
import fixtures from "./fixtures.json";

const pts: LabeledPoint[] = fixtures.points.map(([x, y, c]) => ({ x, y, c: c as 0 | 1 }));

describe("runForest", () => {
  it("matches the Python reference: bootstrap samples and every tree", () => {
    const t = runForest(pts, { trees: 3, maxDepth: 3, seed: 1 });
    const trees = t.frames.at(-1)!.state.trees;
    expect(trees).toHaveLength(3);
    fixtures.trees.forEach((ref, k) => {
      expect(trees[k].sample).toEqual(ref.sample);
      expect(trees[k].nodes.map((n) => ({ depth: n.depth, counts: n.counts, split: n.split ? [n.split.feature, n.split.threshold] : null }))).toEqual(ref.nodes);
    });
  });

  it("records init, then sample / grow / vote per tree, then done", () => {
    const t = runForest(makeDataset("overlap"), FOREST_DEFAULTS);
    expect(t.frames).toHaveLength(1 + 3 * FOREST_DEFAULTS.trees + 1);
    expect(t.frames.slice(1, 4).map((f) => f.event)).toEqual(["sample", "grow", "vote"]);
    for (const tag of ["start", "first-sample", "first-tree", "five-trees", "done"]) expect(frameIndexOfTag(t, tag), tag).toBeGreaterThanOrEqual(0);
  });

  it("bootstrap counts add up to n and some points are left out", () => {
    const data = makeDataset("overlap");
    const t = runForest(data, FOREST_DEFAULTS);
    const counts = t.frames[1].state.counts;
    expect(counts.reduce((a, c) => a + c, 0)).toBe(data.length);
    expect(counts.filter((c) => c === 0).length).toBeGreaterThan(0);
  });

  it("many trees are smoother than one: out-of-bag accuracy is reported and the forest beats a single deep tree on new-ish points", () => {
    const data = makeDataset("overlap", 1, 80);
    const fresh = makeDataset("overlap", 9, 200);
    const acc = (trees: number) => {
      const st = runForest(data, { trees, maxDepth: 8, seed: 3 }).frames.at(-1)!.state;
      return fresh.filter((p) => forestVotes(st.trees, p.x, p.y).prediction === p.c).length / fresh.length;
    };
    expect(acc(50)).toBeGreaterThan(acc(1));
    const last = runForest(data, { trees: 20, maxDepth: 8, seed: 3 }).frames.at(-1)!;
    expect(last.metrics.oob).toBeGreaterThan(0.4);
    expect(last.metrics.oob).toBeLessThanOrEqual(1);
  });

  it("forestVotes counts every tree's vote", () => {
    const st = runForest(pts, { trees: 3, maxDepth: 3, seed: 1 }).frames.at(-1)!.state;
    const v = forestVotes(st.trees, 7, 7);
    expect(v.votes.reduce((a, b) => a + b, 0)).toBe(3);
    expect(v.share).toBeCloseTo(v.votes[1] / 3, 12);
  });

  it("stays within the frame cap with 50 deep trees", () => {
    const t = runForest(makeDataset("moons"), { trees: 50, maxDepth: 8, seed: 1 });
    expect(t.frames.length).toBeLessThanOrEqual(2000);
  });
});

describe("validateForest", () => {
  it("needs at least four points and both classes", () => {
    expect(validateForest(pts.slice(0, 3))).toBe("tooFew");
    expect(validateForest(pts.filter((p) => p.c === 0))).toBe("oneClass");
    expect(validateForest(pts)).toBeNull();
  });
});
