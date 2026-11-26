import { makeDataset } from "../shared/datasets2d";
import type { LessonModule } from "../types";
import { NN_DEFAULTS, runNeuralNet, validateNet, type NetParams, type NetState } from "./algorithm";
import { pseudo, python } from "./code";
import { LabControls } from "./LabControls";
import { Scene, type NetData } from "./Scene";

const neuralNetwork: LessonModule<NetState, NetParams, NetData> = {
  slug: "neural-network",
  defaultParams: NN_DEFAULTS,
  defaultData: { presetId: "circles", points: makeDataset("circles"), drawClass: 0 },
  validate: (data) => validateNet(data.points),
  run: (data, params) => runNeuralNet(data.points, params),
  Scene,
  LabControls,
  code: { python, pseudo },
  stats: (frame, params) => [
    { labelKey: "epoch", value: frame.metrics.epoch, suffix: params ? `/ ${params.epochs}` : undefined },
    { labelKey: "loss", value: Number.isFinite(frame.metrics.loss) ? frame.metrics.loss : null },
    { labelKey: "accuracy", value: Math.round(frame.metrics.accuracy * 1000) / 10, suffix: "%" },
  ],
};

export default neuralNetwork;
