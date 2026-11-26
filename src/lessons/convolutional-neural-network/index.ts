import type { LessonModule } from "../types";
import { CNN_DEFAULTS, digitImage, runCnn, type CnnParams, type CnnState } from "./algorithm";
import { pseudo, python } from "./code";
import { LabControls } from "./LabControls";
import { Scene, type CnnData } from "./Scene";

const cnn: LessonModule<CnnState, CnnParams, CnnData> = {
  slug: "convolutional-neural-network",
  defaultParams: CNN_DEFAULTS,
  defaultData: { presetId: "3", image: digitImage(3, 1, 0) },
  validate: () => null,
  run: (data, params) => runCnn(data.image, params),
  Scene,
  LabControls,
  code: { python, pseudo },
  stats: (frame) => [
    { labelKey: "filter", value: frame.metrics.filter },
    { labelKey: "value", value: Number.isFinite(frame.metrics.value) ? frame.metrics.value : undefined },
    {
      labelKey: "prediction",
      value: frame.state.phase === "dense" || frame.state.phase === "done" ? frame.metrics.prediction : undefined,
    },
  ],
};

export default cnn;
