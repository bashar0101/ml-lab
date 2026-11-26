import type { Frame, Trace } from "@/engine/types";
import type { LabeledPoint } from "../shared/datasets2d";
import { regionGrid } from "../shared/regions";

export type Metric = "euclidean" | "manhattan";

export interface KnnParams {
  k: number;
  metric: Metric;
}

export interface Query {
  x: number;
  y: number;
}

export interface KnnPrediction {
  prediction: 0 | 1 | 2;
  /** Votes per class among the k nearest (length = number of classes, at least 2). */
  votes: number[];
  /** Indices of the k nearest points, closest first. */
  nearest: number[];
  /** Distance from the query to every point, in data order. */
  distances: number[];
  /** k after clamping to the number of points. */
  k: number;
}

export interface KnnState extends Partial<KnnPrediction> {
  query: Query;
  metric: Metric;
  /** The predicted class for every grid cell; only on the final frame. */
  map?: { cells: { x: number; y: number; v: number }[]; size: [number, number] };
}

export const KNN_DEFAULTS: KnnParams = { k: 5, metric: "euclidean" };
export const KNN_LIMITS = { k: { min: 1, max: 25 } } as const;
export const MAP_CELLS = 28;
const DOMAIN: [number, number] = [0, 10];

export function validateKnn(points: LabeledPoint[]): "tooFew" | null {
  return points.length < 2 ? "tooFew" : null;
}

export function distance(a: Query, b: Query, metric: Metric): number {
  return metric === "euclidean" ? Math.hypot(a.x - b.x, a.y - b.y) : Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function knnPredict(points: LabeledPoint[], query: Query, k: number, metric: Metric): KnnPrediction {
  const kk = Math.max(1, Math.min(Math.round(k), points.length));
  const distances = points.map((p) => distance(p, query, metric));
  // Stable: equal distances keep data order.
  const order = distances.map((d, i) => [d, i] as const).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const nearest = order.slice(0, kk).map(([, i]) => i);
  const classes = Math.max(2, ...points.map((p) => p.c + 1));
  const votes = Array.from({ length: classes }, () => 0);
  for (const i of nearest) votes[points[i].c]++;
  const top = Math.max(...votes);
  // A tie is won by the class of the closest point among the tied classes.
  const winner = nearest.find((i) => votes[points[i].c] === top)!;
  return { prediction: points[winner].c, votes, nearest, distances, k: kk };
}

export function runKnn(data: { points: LabeledPoint[]; query: Query }, p: KnnParams): Trace<KnnState> {
  const err = validateKnn(data.points);
  if (err) throw new Error(`Invalid data: ${err}`);
  const r = knnPredict(data.points, data.query, p.k, p.metric);
  const base = { query: data.query, metric: p.metric };
  const metrics = { k: r.k, nearest: r.distances[r.nearest[0]], winnerVotes: r.votes[r.prediction] };
  const frame = (state: KnnState, codeLine: string, event: string, tags: string[]): Frame<KnnState> => ({ state, codeLine, event, tags, metrics });

  const map = regionGrid((x, y) => knnPredict(data.points, { x, y }, p.k, p.metric).prediction, DOMAIN, DOMAIN, MAP_CELLS);
  const frames = [
    frame({ ...base }, "init", "init", ["start"]),
    frame({ ...base, distances: r.distances, k: r.k }, "measure", "measure", ["measure"]),
    frame({ ...base, distances: r.distances, nearest: r.nearest, k: r.k }, "sort", "nearest", ["nearest"]),
    frame({ ...base, distances: r.distances, nearest: r.nearest, votes: r.votes, k: r.k }, "vote", "vote", ["vote"]),
    frame({ ...r, ...base }, "decide", "decide", ["decide"]),
    frame({ ...r, ...base, map }, "map", "map", ["map", "done"]),
  ];
  return { frames, meta: { algorithm: "k-nearest-neighbors", seed: 0, truncated: false } };
}
