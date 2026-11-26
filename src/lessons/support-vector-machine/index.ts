import { makeDataset } from "../shared/datasets2d";
import type { LessonModule } from "../types";
import { runSvm, SVM_DEFAULTS, validateSvm, type SvmParams, type SvmState } from "./algorithm";
import { pseudo, python } from "./code";
import { LabControls } from "./LabControls";
import { Scene, type SvmData } from "./Scene";

const supportVectorMachine: LessonModule<SvmState, SvmParams, SvmData> = {
  slug: "support-vector-machine",
  defaultParams: SVM_DEFAULTS,
  defaultData: { presetId: "blobs", points: makeDataset("blobs"), drawClass: 0 },
  validate: (data) => validateSvm(data.points),
  run: (data, params) => runSvm(data.points, params),
  Scene,
  LabControls,
  code: { python, pseudo },
  stats: (frame, params) => [
    { labelKey: "epoch", value: frame.metrics.epoch, suffix: params ? `/ ${params.epochs}` : undefined },
    { labelKey: "accuracy", value: Math.round(frame.metrics.accuracy * 1000) / 10, suffix: "%" },
    { labelKey: "supports", value: frame.metrics.supports },
  ],
};

export default supportVectorMachine;
