import { makeDataset } from "../shared/datasets2d";
import type { LessonModule } from "../types";
import { LOG_DEFAULTS, runLogistic, validateLogistic, type LogParams, type LogState } from "./algorithm";
import { pseudo, python } from "./code";
import { LabControls } from "./LabControls";
import { Scene, type LogData } from "./Scene";

const sane = (v: number) => (Number.isFinite(v) && Math.abs(v) <= 1e6 ? v : null);

const logisticRegression: LessonModule<LogState, LogParams, LogData> = {
  slug: "logistic-regression",
  defaultParams: LOG_DEFAULTS,
  defaultData: { presetId: "overlap", points: makeDataset("overlap"), drawClass: 0 },
  validate: (data) => validateLogistic(data.points),
  run: (data, params) => runLogistic(data.points, params),
  Scene,
  LabControls,
  code: { python, pseudo },
  stats: (frame, params) => [
    { labelKey: "step", value: frame.metrics.step, suffix: params ? `/ ${params.steps}` : undefined },
    { labelKey: "loss", value: sane(frame.metrics.loss) },
    { labelKey: "accuracy", value: Math.round(frame.metrics.accuracy * 1000) / 10, suffix: "%" },
  ],
};

export default logisticRegression;
