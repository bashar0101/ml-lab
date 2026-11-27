import { makeDataset } from "../shared/datasets2d";
import type { LessonModule } from "../types";
import { KMEANS_DEFAULTS, runKMeans, validateKMeans, type KMeansParams, type KMeansState } from "./algorithm";
import { pseudo, python } from "./code";
import { LabControls } from "./LabControls";
import { PAPER_K, PAPER_POINTS } from "./paper";
import { Scene, type KMeansData } from "./Scene";

const kMeans: LessonModule<KMeansState, KMeansParams, KMeansData> = {
  slug: "k-means",
  defaultParams: KMEANS_DEFAULTS,
  defaultData: { presetId: "three-blobs", points: makeDataset("three-blobs"), drawClass: 0 },
  validate: (data) => validateKMeans(data.points),
  run: (data, params) => runKMeans(data.points, params),
  Scene,
  LabControls,
  code: { python, pseudo },
  byHand: {
    data: { presetId: "by-hand", points: PAPER_POINTS.map(([x, y]) => ({ x, y, c: 0 })), drawClass: 0 },
    params: { ...KMEANS_DEFAULTS, k: PAPER_K, init: "first" },
  },
  stats: (frame) => [
    { labelKey: "iteration", value: frame.metrics.iteration },
    { labelKey: "inertia", value: Math.round(frame.metrics.inertia * 10) / 10 },
    { labelKey: "changed", value: frame.event === "init" ? undefined : frame.metrics.changed },
  ],
};

export default kMeans;
