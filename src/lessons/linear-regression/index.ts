import type { LessonModule } from "../types";
import { LR_DEFAULTS, runLinearRegression, validateData, type LrParams, type LrState } from "./algorithm";
import { pseudo, python } from "./code";
import { LabControls } from "./LabControls";
import { getPreset, PRESETS } from "./presets";
import { Scene, type LrData } from "./Scene";

const TOO_BIG = 1e6;
const sane = (v: number) => (Number.isFinite(v) && Math.abs(v) <= TOO_BIG ? v : null);

const linearRegression: LessonModule<LrState, LrParams, LrData> = {
  slug: "linear-regression",
  defaultParams: LR_DEFAULTS,
  defaultData: { presetId: PRESETS[0].id, points: PRESETS[0].points },
  validate: (data) => validateData(data.points),
  run: (data, params) => runLinearRegression(data.points, params),
  Scene,
  LabControls,
  code: { python, pseudo },
  byHand: { data: { presetId: "car-prices", points: getPreset("car-prices")!.points }, params: { ...LR_DEFAULTS, learningRate: 0.3 } },
  stats: (frame, params) => [
    { labelKey: "step", value: frame.metrics.iteration, suffix: params ? `/ ${params.steps}` : undefined },
    { labelKey: "loss", value: sane(frame.metrics.loss) },
    { labelKey: "slope", value: sane(frame.metrics.slope) },
  ],
};

export default linearRegression;
