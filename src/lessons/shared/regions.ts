import type { Range } from "./axes";

export const MAX_REGION_CELLS = 32;

/** Evaluate `predict` at the centre of an n×n grid (n ≤ 32 so the SVG stays light on phones). */
export function regionGrid(
  predict: (x: number, y: number) => number,
  [x0, x1]: Range,
  [y0, y1]: Range,
  n: number,
): { cells: { x: number; y: number; v: number }[]; size: [number, number] } {
  const m = Math.max(1, Math.min(MAX_REGION_CELLS, Math.round(n)));
  const w = (x1 - x0) / m;
  const h = (y1 - y0) / m;
  const cells: { x: number; y: number; v: number }[] = [];
  for (let j = 0; j < m; j++)
    for (let i = 0; i < m; i++) {
      const x = x0 + (i + 0.5) * w;
      const y = y0 + (j + 0.5) * h;
      cells.push({ x, y, v: predict(x, y) });
    }
  return { cells, size: [w, h] };
}
