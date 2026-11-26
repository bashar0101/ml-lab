import type { Range } from "./axes";

type Pt = [number, number];

/**
 * Marching squares: line segments where f(x, y) = level, on an n×n grid.
 * Good enough for smooth teaching surfaces; saddle cells pick one pairing.
 */
export function contourSegments(f: (x: number, y: number) => number, [x0, x1]: Range, [y0, y1]: Range, n: number, level: number): Pt[][] {
  const dx = (x1 - x0) / n;
  const dy = (y1 - y0) / n;
  const v: number[][] = [];
  for (let j = 0; j <= n; j++) {
    v.push([]);
    for (let i = 0; i <= n; i++) v[j].push(f(x0 + i * dx, y0 + j * dy) - level);
  }

  const lerp = (a: Pt, b: Pt, va: number, vb: number): Pt => {
    const t = va === vb ? 0.5 : va / (va - vb);
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  };

  const segs: Pt[][] = [];
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const c: Pt[] = [
        [x0 + i * dx, y0 + j * dy],
        [x0 + (i + 1) * dx, y0 + j * dy],
        [x0 + (i + 1) * dx, y0 + (j + 1) * dy],
        [x0 + i * dx, y0 + (j + 1) * dy],
      ];
      const cv = [v[j][i], v[j][i + 1], v[j + 1][i + 1], v[j + 1][i]];
      if (cv.some((q) => !Number.isFinite(q))) continue;
      const hits: Pt[] = [];
      for (let e = 0; e < 4; e++) {
        const a = cv[e];
        const b = cv[(e + 1) % 4];
        if ((a < 0) !== (b < 0)) hits.push(lerp(c[e], c[(e + 1) % 4], a, b));
      }
      if (hits.length === 2) segs.push(hits);
      else if (hits.length === 4) segs.push([hits[0], hits[1]], [hits[2], hits[3]]);
    }
  return segs;
}
