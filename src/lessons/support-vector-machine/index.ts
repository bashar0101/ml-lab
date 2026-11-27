import { makeDataset } from "../shared/datasets2d";
import type { LessonModule } from "../types";
import { runSvm, SVM_DEFAULTS, validateSvm, type SvmParams, type SvmState } from "./algorithm";
import { pseudo, python } from "./code";
import { LabControls } from "./LabControls";
import { PAPER_POINTS } from "./paper";
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
  // The paper's +1 class is class B (the Lab's +1); C = 1 and 60 epochs land close to the paper's line.
  byHand: {
    data: { presetId: "by-hand", points: PAPER_POINTS.map((p) => ({ x: p.x[0], y: p.x[1], c: p.y === 1 ? 1 : 0 })), drawClass: 0 },
    params: { ...SVM_DEFAULTS, kernel: "linear", C: 1, epochs: 60 },
  },
  stats: (frame, params) => [
    { labelKey: "epoch", value: frame.metrics.epoch, suffix: params ? `/ ${params.epochs}` : undefined },
    { labelKey: "accuracy", value: Math.round(frame.metrics.accuracy * 1000) / 10, suffix: "%" },
    { labelKey: "supports", value: frame.metrics.supports },
  ],
};

export default supportVectorMachine;
