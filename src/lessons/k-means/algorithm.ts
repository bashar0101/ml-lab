import { mulberry32, shuffled } from "@/engine/random";
import type { Frame, Trace } from "@/engine/types";
import type { LabeledPoint } from "../shared/datasets2d";

export type KMeansInit = "random" | "plus-plus" | "first";

export interface KMeansParams {
  k: number;
  init: KMeansInit;
  seed: number;
}

export interface Centroid {
  x: number;
  y: number;
}

export interface KMeansState {
  iteration: number;
  centroids: Centroid[];
  /** Cluster of every point, or null before the first assignment. */
  assign: number[] | null;
  /** Every centroid position so far, per cluster (for the trails). */
  trails: Centroid[][];
}

export const KMEANS_DEFAULTS: KMeansParams = { k: 3, init: "random", seed: 6 };
export const KMEANS_LIMITS = { k: { min: 1, max: 6 } } as const;
export const MAX_ITER = 20;

export function validateKMeans(points: LabeledPoint[]): "tooFew" | null {
  return points.length < 2 ? "tooFew" : null;
}

const d2 = (a: Centroid, b: Centroid) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

function initCentroids(points: LabeledPoint[], k: number, kind: KMeansInit, rand: () => number): Centroid[] {
  const n = points.length;
  // "first": the first k points, as a worked example on paper starts.
  if (kind === "first") return points.slice(0, k).map((p) => ({ x: p.x, y: p.y }));
  if (kind === "random") return shuffled(n, rand).slice(0, k).map((i) => ({ x: points[i].x, y: points[i].y }));
  // k-means++: each next centre is drawn with probability ∝ squared distance to the nearest chosen one.
  const first = points[Math.floor(rand() * n)];
  const cents: Centroid[] = [{ x: first.x, y: first.y }];
  while (cents.length < k) {
    const dist = points.map((p) => Math.min(...cents.map((c) => d2(p, c))));
    const r = rand() * dist.reduce((a, v) => a + v, 0);
    let acc = 0;
    let pick = n - 1;
    for (let i = 0; i < n; i++) {
      acc += dist[i];
      if (acc >= r && dist[i] > 0) {
        pick = i;
        break;
      }
    }
    cents.push({ x: points[pick].x, y: points[pick].y });
  }
  return cents;
}

/** Nearest centroid; ties go to the lowest index. */
function nearest(p: Centroid, cents: Centroid[]): number {
  let best = 0;
  for (let j = 1; j < cents.length; j++) if (d2(p, cents[j]) < d2(p, cents[best])) best = j;
  return best;
}

export function runKMeans(points: LabeledPoint[], p: KMeansParams): Trace<KMeansState> {
  const err = validateKMeans(points);
  if (err) throw new Error(`Invalid data: ${err}`);
  const k = Math.max(1, Math.min(Math.round(p.k), points.length));
  const rand = mulberry32(p.seed);
  let cents = initCentroids(points, k, p.init, rand);
  const trails: Centroid[][] = cents.map((c) => [{ ...c }]);
  let assign: number[] | null = null;
  const frames: Frame<KMeansState>[] = [];

  const inertia = (a: number[] | null) => points.reduce((s, q, i) => s + d2(q, cents[a ? a[i] : nearest(q, cents)]), 0);
  const push = (iteration: number, codeLine: string, event: string, changed: number, tags: string[] = []) =>
    frames.push({
      state: { iteration, centroids: cents.map((c) => ({ ...c })), assign: assign ? [...assign] : null, trails: trails.map((t) => t.map((c) => ({ ...c }))) },
      codeLine,
      event,
      tags,
      metrics: { iteration, inertia: inertia(assign), changed },
    });

  push(0, "init", "init", 0, ["start"]);
  for (let it = 1; it <= MAX_ITER; it++) {
    const next = points.map((q) => nearest(q, cents));
    const changed = assign ? next.filter((c, i) => c !== assign![i]).length : points.length;
    if (assign && changed === 0) {
      push(it - 1, "return", "done", 0, ["done"]);
      return { frames, meta: { algorithm: "k-means", seed: p.seed, truncated: false } };
    }
    assign = next;
    push(it, "assign", "assign", changed, it === 1 ? ["first-assign"] : []);
    cents = cents.map((c, j) => {
      const members = points.filter((_, i) => assign![i] === j);
      // An empty cluster keeps its old centre.
      if (!members.length) return c;
      return { x: members.reduce((s, q) => s + q.x, 0) / members.length, y: members.reduce((s, q) => s + q.y, 0) / members.length };
    });
    cents.forEach((c, j) => trails[j].push({ ...c }));
    push(it, "update", "update", changed, it === 1 ? ["first-update"] : it === 3 ? ["iter-3"] : []);
  }
  push(MAX_ITER, "return", "done", 0, ["done"]);
  return { frames, meta: { algorithm: "k-means", seed: p.seed, truncated: false } };
}
