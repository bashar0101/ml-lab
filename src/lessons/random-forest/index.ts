import { makeDataset } from "../shared/datasets2d";
import type { LessonModule } from "../types";
import { FOREST_DEFAULTS, runForest, validateForest, type ForestParams, type ForestState } from "./algorithm";
import { pseudo, python } from "./code";
import { LabControls } from "./LabControls";
import { Scene, type ForestData } from "./Scene";

const pct = (v: number) => (Number.isFinite(v) ? Math.round(v * 1000) / 10 : null);

const randomForest: LessonModule<ForestState, ForestParams, ForestData> = {
  slug: "random-forest",
  defaultParams: FOREST_DEFAULTS,
  defaultData: { presetId: "overlap", points: makeDataset("overlap"), drawClass: 0 },
  validate: (data) => validateForest(data.points),
  run: (data, params) => runForest(data.points, params),
  Scene,
  LabControls,
  code: { python, pseudo },
  stats: (frame, params) => [
    { labelKey: "trees", value: frame.metrics.trees, suffix: params ? `/ ${params.trees}` : undefined },
    { labelKey: "accuracy", value: frame.metrics.trees ? pct(frame.metrics.accuracy) : null, suffix: "%" },
    { labelKey: "oob", value: pct(frame.metrics.oob), suffix: "%" },
  ],
};

export default randomForest;
