import { describe, expect, it } from "vitest";
import { clipLine, niceDomain } from "./axes";
import { contourSegments } from "./contours";
import { makeDataset, type Dataset2DId } from "./datasets2d";
import { regionGrid } from "./regions";

describe("axes", () => {
  it("niceDomain rounds out to tidy ticks", () => {
    expect(niceDomain([1, 9])).toEqual({ domain: [0, 10], ticks: [0, 2, 4, 6, 8, 10] });
    expect(niceDomain([0, 85]).domain).toEqual([0, 100]);
  });

  it("clipLine keeps the true slope and returns null when the line misses the box", () => {
    const seg = clipLine({ slope: 30, intercept: -100 }, [0, 10], [0, 100])!;
    const slope = (seg[1][1] - seg[0][1]) / (seg[1][0] - seg[0][0]);
    expect(slope).toBeCloseTo(30, 9);
    expect(clipLine({ slope: 0, intercept: 500 }, [0, 10], [0, 100])).toBeNull();
  });
});

describe("datasets2d", () => {
  const ids: Dataset2DId[] = ["blobs", "overlap", "circles", "moons", "xor", "three-blobs"];

  it.each(ids)("%s is deterministic, inside the 0–10 box and has every class", (id) => {
    const a = makeDataset(id, 3);
    expect(makeDataset(id, 3)).toEqual(a);
    expect(makeDataset(id, 4)).not.toEqual(a);
    for (const p of a) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(10);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(10);
    }
    const classes = new Set(a.map((p) => p.c));
    expect(classes.size).toBe(id === "three-blobs" ? 3 : 2);
  });

  it("circles can't be separated by any straight line (best line stays under 80 %)", () => {
    const pts = makeDataset("circles");
    let best = 0;
    for (let deg = 0; deg < 180; deg += 3) {
      const [ux, uy] = [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180)];
      for (let t = -2; t <= 16; t += 0.1) {
        const right = pts.filter((p) => (p.x * ux + p.y * uy > t ? 1 : 0) === p.c).length / pts.length;
        best = Math.max(best, right, 1 - right);
      }
    }
    expect(best).toBeLessThan(0.8);
  });

  it("blobs are separable by a straight line", () => {
    const pts = makeDataset("blobs");
    expect(pts.every((p) => (p.x + p.y > 10 ? 1 : 0) === p.c)).toBe(true);
  });
});

describe("regionGrid", () => {
  it("evaluates n×n cell centres and caps n at 32", () => {
    const g = regionGrid((x) => (x > 5 ? 1 : 0), [0, 10], [0, 10], 10);
    expect(g.cells).toHaveLength(100);
    expect(g.size).toEqual([1, 1]);
    expect(g.cells[0]).toEqual({ x: 0.5, y: 0.5, v: 0 });
    expect(regionGrid(() => 0, [0, 10], [0, 10], 100).cells).toHaveLength(32 * 32);
  });
});

describe("contourSegments", () => {
  it("traces the level set of a circle", () => {
    const segs = contourSegments((x, y) => x * x + y * y, [-2, 2], [-2, 2], 40, 1);
    expect(segs.length).toBeGreaterThan(20);
    for (const s of segs) for (const [x, y] of s) expect(Math.hypot(x, y)).toBeCloseTo(1, 1);
  });

  it("returns nothing for a level the function never reaches", () => {
    expect(contourSegments((x, y) => x * x + y * y, [-1, 1], [-1, 1], 10, 50)).toEqual([]);
  });
});

describe("moons", () => {
  it("fits inside the box without piling up on the edges", () => {
    const pts = makeDataset("moons");
    expect(pts.filter((p) => p.x <= 0.3 || p.x >= 9.7 || p.y <= 0.3 || p.y >= 9.7)).toHaveLength(0);
  });
});
