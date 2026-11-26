import { makeDataset } from "../shared/datasets2d";
import type { LessonModule } from "../types";
import { KNN_DEFAULTS, runKnn, validateKnn, type KnnParams, type KnnState } from "./algorithm";
import { pseudo, python } from "./code";
import { LabControls } from "./LabControls";
import { Scene, type KnnData } from "./Scene";

const kNearestNeighbors: LessonModule<KnnState, KnnParams, KnnData> = {
  slug: "k-nearest-neighbors",
  defaultParams: KNN_DEFAULTS,
  defaultData: { presetId: "blobs", points: makeDataset("blobs"), drawClass: 0, query: { x: 5.4, y: 4.6 } },
  validate: (data) => validateKnn(data.points),
  run: (data, params) => runKnn(data, params),
  Scene,
  LabControls,
  code: { python, pseudo },
  stats: (frame) => [
    { labelKey: "k", value: frame.metrics.k },
    { labelKey: "nearest", value: frame.metrics.nearest },
    { labelKey: "votes", value: frame.metrics.winnerVotes, suffix: `/ ${frame.metrics.k}` },
  ],
};

export default kNearestNeighbors;
