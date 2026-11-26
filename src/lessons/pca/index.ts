import { makeDataset } from "../shared/datasets2d";
import type { LessonModule } from "../types";
import { PCA_DEFAULTS, runPca, validatePca, type PcaParams, type PcaState } from "./algorithm";
import { pseudo, python } from "./code";
import { LabControls } from "./LabControls";
import { Scene, type PcaData } from "./Scene";

const finite = (v: number, digits = 2) => (Number.isFinite(v) ? Number(v.toFixed(digits)) : null);

const pca: LessonModule<PcaState, PcaParams, PcaData> = {
  slug: "pca",
  defaultParams: PCA_DEFAULTS,
  defaultData: { presetId: "ellipse", points: makeDataset("ellipse"), drawClass: 0 },
  validate: (data) => validatePca(data.points),
  run: (data, params) => runPca(data.points, params),
  // Keeping 1 or 2 components only changes the last frames' picture.
  viewOnly: () => true,
  Scene,
  LabControls,
  code: { python, pseudo },
  stats: (frame) => [
    { labelKey: "angle", value: finite(frame.metrics.angle, 0), suffix: "°" },
    { labelKey: "spread", value: finite(frame.metrics.variance) },
    { labelKey: "kept", value: finite(frame.metrics.explained * 100, 1), suffix: "%" },
  ],
};

export default pca;
