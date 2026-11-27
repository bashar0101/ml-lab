import type { LessonModule } from "../types";
import { GD_DEFAULTS, runGradientDescent, type GdParams, type GdState } from "./algorithm";
import { pseudo, python } from "./code";
import { LabControls } from "./LabControls";
import { getSurface } from "./surfaces";
import { Scene, type GdData } from "./Scene";

const TOO_BIG = 1e6;
const sane = (v: number) => (Number.isFinite(v) && Math.abs(v) <= TOO_BIG ? v : null);

const gradientDescent: LessonModule<GdState, GdParams, GdData> = {
  slug: "gradient-descent",
  defaultParams: GD_DEFAULTS,
  defaultData: { start: null },
  validate: () => null,
  run: (data, params) => runGradientDescent({ ...params, start: data.start }),
  Scene,
  LabControls,
  code: { python, pseudo },
  byHand: { data: { start: null }, params: { ...GD_DEFAULTS, surface: "paper", learningRate: getSurface("paper").lr, steps: 10 } },
  stats: (frame, params) => [
    { labelKey: "step", value: frame.metrics.step, suffix: params ? `/ ${params.steps}` : undefined },
    { labelKey: "height", value: sane(frame.metrics.f) },
    { labelKey: "slope", value: sane(frame.metrics.grad) },
  ],
};

export default gradientDescent;
