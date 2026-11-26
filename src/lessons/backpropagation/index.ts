import { makeDataset } from "../shared/datasets2d";
import type { LessonModule } from "../types";
import { BP_DEFAULTS, runBackprop, validateBackprop, type BackpropParams, type BackpropState } from "./algorithm";
import { pseudo, python } from "./code";
import { LabControls } from "./LabControls";
import { Scene, type BackpropData } from "./Scene";

const backpropagation: LessonModule<BackpropState, BackpropParams, BackpropData> = {
  slug: "backpropagation",
  defaultParams: BP_DEFAULTS,
  defaultData: { presetId: "blobs", points: makeDataset("blobs"), drawClass: 0 },
  validate: (data) => validateBackprop(data.points),
  run: (data, params) => runBackprop(data.points, params),
  Scene,
  LabControls,
  code: { python, pseudo },
  stats: (frame) => [
    { labelKey: "prediction", value: frame.state.shownForward >= frame.state.net.W.length ? frame.metrics.prediction : undefined },
    { labelKey: "loss", value: frame.event === "init" || frame.event === "forward" ? undefined : frame.metrics.loss },
    { labelKey: "ratio", value: frame.metrics.ratio !== undefined && Number.isFinite(frame.metrics.ratio) ? frame.metrics.ratio : undefined, suffix: "×" },
  ],
};

export default backpropagation;
