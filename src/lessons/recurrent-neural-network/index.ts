import type { LessonModule } from "../types";
import { RNN_DEFAULTS, runRnn, validateText, type RnnParams, type RnnState } from "./algorithm";
import { pseudo, python } from "./code";
import { LabControls, RNN_PRESETS } from "./LabControls";
import { Scene, type RnnData } from "./Scene";

const rnn: LessonModule<RnnState, RnnParams, RnnData> = {
  slug: "recurrent-neural-network",
  defaultParams: RNN_DEFAULTS,
  defaultData: { presetId: "medium", text: RNN_PRESETS.medium },
  validate: (data) => validateText(data.text),
  run: (data, params) => runRnn(data.text, params),
  Scene,
  LabControls,
  code: { python, pseudo },
  stats: (frame) => [
    { labelKey: "step", value: frame.metrics.step, suffix: `/ ${frame.metrics.length}` },
    { labelKey: "chanceA", value: frame.state.answered ? Math.round(frame.metrics.prob * 1000) / 10 : undefined, suffix: "%" },
    { labelKey: "memory", value: frame.metrics.memory },
  ],
};

export default rnn;
