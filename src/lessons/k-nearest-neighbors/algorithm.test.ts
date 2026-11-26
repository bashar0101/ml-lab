import { describe, expect, it } from "vitest";
import { frameIndexOfTag } from "@/engine/types";
import { makeDataset, type LabeledPoint } from "../shared/datasets2d";
import { KNN_DEFAULTS, knnPredict, runKnn, validateKnn } from "./algorithm";
import fixtures from "./fixtures.json";

const pts: LabeledPoint[] = fixtures.points.map(([x, y, c]) => ({ x, y, c: c as 0 | 1 }));

describe("knnPredict", () => {
  it.each(fixtures.cases.map((c) => [`${c.query} k=${c.k} ${c.metric}`, c] as const))("matches NumPy: %s", (_n, c) => {
    const r = knnPredict(pts, { x: c.query[0], y: c.query[1] }, c.k, c.metric as "euclidean" | "manhattan");
    expect(r.prediction).toBe(c.prediction);
    expect(r.votes.slice(0, 2)).toEqual(c.votes);
    expect(r.nearest).toEqual(c.nearest);
  });

  it("a tie is won by the class of the closest neighbour", () => {
    const two: LabeledPoint[] = [
      { x: 1, y: 0, c: 1 },
      { x: 2, y: 0, c: 0 },
    ];
    expect(knnPredict(two, { x: 0, y: 0 }, 2, "euclidean").prediction).toBe(1);
    expect(knnPredict(two, { x: 3, y: 0 }, 2, "euclidean").prediction).toBe(0);
  });

  it("clamps k to the number of points", () => {
    const r = knnPredict(pts, { x: 5, y: 5 }, 99, "euclidean");
    expect(r.k).toBe(pts.length);
    expect(r.nearest).toHaveLength(pts.length);
  });

  it("works with three classes", () => {
    const r = knnPredict(makeDataset("three-blobs"), { x: 5, y: 7.2 }, 5, "euclidean");
    expect(r.prediction).toBe(2);
    expect(r.votes).toHaveLength(3);
  });
});

describe("runKnn", () => {
  it("walks measure → nearest → vote → decide → map", () => {
    const t = runKnn({ points: pts, query: { x: 5, y: 5 } }, KNN_DEFAULTS);
    expect(t.frames.map((f) => f.event)).toEqual(["init", "measure", "nearest", "vote", "decide", "map"]);
    for (const tag of ["start", "measure", "nearest", "vote", "decide", "map", "done"]) expect(frameIndexOfTag(t, tag), tag).toBeGreaterThanOrEqual(0);
    const last = t.frames.at(-1)!.state;
    expect(last.map!.cells).toHaveLength(28 * 28);
    expect(last.prediction).toBe(knnPredict(pts, { x: 5, y: 5 }, 5, "euclidean").prediction);
  });

  it("k = 1 makes islands; k = all points predicts the majority everywhere (uneven classes)", () => {
    const overlap = makeDataset("overlap");
    // Drop three class-1 points so class 0 is the clear majority (an even split would tie).
    const uneven = overlap.filter((p, i) => !(p.c === 1 && i >= overlap.length - 3));
    const data = { points: uneven, query: { x: 5, y: 5 } };
    const all = runKnn(data, { k: 99, metric: "euclidean" }).frames.at(-1)!.state.map!;
    expect(new Set(all.cells.map((c) => c.v)).size).toBe(1);
    const one = runKnn(data, { k: 1, metric: "euclidean" }).frames.at(-1)!.state.map!;
    expect(new Set(one.cells.map((c) => c.v)).size).toBe(2);
  });
});

describe("validateKnn", () => {
  it("needs at least two points", () => {
    expect(validateKnn([])).toBe("tooFew");
    expect(validateKnn(pts.slice(0, 1))).toBe("tooFew");
    expect(validateKnn(pts.slice(0, 2))).toBeNull();
  });
});
