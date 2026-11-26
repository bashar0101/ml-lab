import { describe, expect, it } from "vitest";
import { frameIndexOfTag } from "@/engine/types";
import { makeDataset, type LabeledPoint } from "../shared/datasets2d";
import { KMEANS_DEFAULTS, runKMeans, validateKMeans } from "./algorithm";
import fixtures from "./fixtures.json";

const pts: LabeledPoint[] = fixtures.points.map(([x, y]) => ({ x, y, c: 0 }));

describe("runKMeans", () => {
  it.each([
    ["random init", fixtures.random, { k: 3, init: "random" as const, seed: 9 }],
    ["k-means++ init", fixtures.plusPlus, { k: 4, init: "plus-plus" as const, seed: 13 }],
  ])("matches the Python reference: %s", (_n, ref, p) => {
    const t = runKMeans(pts, p);
    const updates = t.frames.filter((f) => f.event === "update");
    expect(updates).toHaveLength(ref.length);
    ref.forEach((it, i) => {
      expect(updates[i].state.assign).toEqual(it.assign);
      updates[i].state.centroids.forEach((c, j) => {
        expect(c.x).toBeCloseTo(it.centroids[j][0], 12);
        expect(c.y).toBeCloseTo(it.centroids[j][1], 12);
      });
    });
  });

  it("alternates assign and update, ends with a converged frame, and has the story tags", () => {
    const t = runKMeans(makeDataset("three-blobs"), KMEANS_DEFAULTS);
    expect(t.frames[0]).toMatchObject({ event: "init", tags: ["start"] });
    expect(t.frames[1].event).toBe("assign");
    expect(t.frames[2].event).toBe("update");
    expect(t.frames.at(-1)).toMatchObject({ event: "done", tags: ["done"] });
    for (const tag of ["first-assign", "first-update"]) expect(frameIndexOfTag(t, tag), tag).toBeGreaterThan(0);
  });

  it("inertia never goes up", () => {
    for (const id of ["three-blobs", "moons", "circles"] as const) {
      const t = runKMeans(makeDataset(id), { k: 4, init: "random", seed: 5 });
      const inertia = t.frames.filter((f) => f.event !== "init").map((f) => f.metrics.inertia);
      for (let i = 1; i < inertia.length; i++) expect(inertia[i]).toBeLessThanOrEqual(inertia[i - 1] + 1e-9);
    }
  });

  it("an empty cluster keeps its centroid and nothing becomes NaN", () => {
    const twins: LabeledPoint[] = [
      { x: 1, y: 1, c: 0 },
      { x: 1, y: 1, c: 0 },
      { x: 9, y: 9, c: 0 },
    ];
    const t = runKMeans(twins, { k: 3, init: "random", seed: 1 });
    for (const f of t.frames) for (const c of f.state.centroids) expect(Number.isFinite(c.x) && Number.isFinite(c.y)).toBe(true);
  });

  it("k-means++ starts from k distinct points", () => {
    const t = runKMeans(makeDataset("three-blobs"), { k: 3, init: "plus-plus", seed: 4 });
    const c = t.frames[0].state.centroids;
    expect(new Set(c.map((q) => `${q.x},${q.y}`)).size).toBe(3);
  });

  it("clamps k to the number of points", () => {
    const t = runKMeans(pts.slice(0, 2), { k: 5, init: "random", seed: 1 });
    expect(t.frames[0].state.centroids).toHaveLength(2);
  });
});

describe("validateKMeans", () => {
  it("needs at least two points", () => {
    expect(validateKMeans([])).toBe("tooFew");
    expect(validateKMeans(pts.slice(0, 1))).toBe("tooFew");
    expect(validateKMeans(pts)).toBeNull();
  });
});
