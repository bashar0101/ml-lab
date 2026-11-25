import type { Trace } from "@/engine/types";
import type { LrState, Point } from "./algorithm";
import { lrLoss } from "./algorithm";

export type Range = [number, number];

export interface SurfacePolygon {
  /** Corners in unit isometric space (see isoUnit). */
  points: [number, number][];
  /** 0 (bottom of the bowl) … 1 (highest corner of the grid). */
  height: number;
}

export interface SurfaceBox {
  wRange: Range;
  bRange: Range;
  /** SVG position of unit-space (0, 0). */
  origin: [number, number];
  /** SVG units per unit-space unit. */
  size: number;
  heightScale: number;
}

export const HEIGHT_SCALE = 0.7;

/** u, v in 0..1 across the grid; h in 0..1. Viewed from the far corner: larger u+v is nearer. */
export function isoUnit(u: number, v: number, h: number, heightScale = HEIGHT_SCALE): [number, number] {
  return [u - v, (u + v) / 2 - h * heightScale];
}

/** Softened (square-root) height of the loss, normalised over the grid. */
export function makeHeightFn(
  loss: (w: number, b: number) => number,
  wRange: Range,
  bRange: Range,
  n: number,
): (w: number, b: number) => number {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i <= n; i++)
    for (let j = 0; j <= n; j++) {
      const l = loss(lerp(wRange, i / n), lerp(bRange, j / n));
      if (l < min) min = l;
      if (l > max) max = l;
    }
  const span = Math.sqrt(Math.max(max - min, 1e-12));
  return (w, b) => {
    const l = loss(w, b);
    if (!Number.isFinite(l)) return 1;
    return Math.max(0, Math.min(1, Math.sqrt(Math.max(0, l - min)) / span));
  };
}

function lerp([a, b]: Range, t: number): number {
  return a + (b - a) * t;
}

/** n×n cells of the loss surface in unit iso space, ordered back to front. */
export function buildSurface(
  loss: (w: number, b: number) => number,
  wRange: Range,
  bRange: Range,
  n: number,
  heightScale = HEIGHT_SCALE,
): SurfacePolygon[] {
  const h = makeHeightFn(loss, wRange, bRange, n);
  const cells: { order: number; poly: SurfacePolygon }[] = [];
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const corners: [number, number][] = [
        [i, j],
        [i + 1, j],
        [i + 1, j + 1],
        [i, j + 1],
      ];
      const points = corners.map(([a, c]) => isoUnit(a / n, c / n, h(lerp(wRange, a / n), lerp(bRange, c / n)), heightScale));
      const height = h(lerp(wRange, (i + 0.5) / n), lerp(bRange, (j + 0.5) / n));
      cells.push({ order: i + j, poly: { points, height } });
    }
  return cells.sort((a, b) => a.order - b.order).map((c) => c.poly);
}

/** Map a model point onto the SVG, clamped into the grid. */
export function isoProject(w: number, b: number, z: number, box: SurfaceBox): [number, number] {
  const u = clamp01((w - box.wRange[0]) / (box.wRange[1] - box.wRange[0]));
  const v = clamp01((b - box.bRange[0]) / (box.bRange[1] - box.bRange[0]));
  const [x, y] = isoUnit(u, v, clamp01(z), box.heightScale);
  return [box.origin[0] + x * box.size, box.origin[1] + y * box.size];
}

function clamp01(t: number): number {
  return Number.isFinite(t) ? Math.max(0, Math.min(1, t)) : 0;
}

/**
 * Grid ranges centred on the least-squares optimum, wide enough to show the start point
 * with a 15 % margin. Diverged frames are ignored so a blown-up run doesn't flatten the bowl.
 */
export function surfaceRanges(points: Point[], trace: Trace<LrState>): { wRange: Range; bRange: Range } {
  const s0 = trace.frames[0].state;
  const { mean, std } = s0;
  const xs = points.map((p) => (p.x - mean) / std);
  const wOpt = xs.reduce((acc, x, i) => acc + x * points[i].y, 0) / points.length;
  const bOpt = points.reduce((acc, p) => acc + p.y, 0) / points.length;
  const dw = Math.max(Math.abs(s0.w - wOpt), 1) * 1.15;
  const db = Math.max(Math.abs(s0.b - bOpt), 1) * 1.15;
  return { wRange: [wOpt - dw, wOpt + dw], bRange: [bOpt - db, bOpt + db] };
}

export function lossFor(points: Point[], s: Pick<LrState, "mean" | "std">) {
  return (w: number, b: number) => lrLoss(points, w, b, s.mean, s.std);
}
