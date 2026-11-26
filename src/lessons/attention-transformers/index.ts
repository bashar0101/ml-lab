import type { LessonModule } from "../types";
import { ATTN_DEFAULTS, runAttention, validateSentence, type AttnParams, type AttnState } from "./algorithm";
import { pseudo, python } from "./code";
import { ATTN_PRESETS, LabControls } from "./LabControls";
import { Scene, type AttnData } from "./Scene";

const SHOWN: AttnState["stage"][] = ["softmax", "mix", "all", "done"];

const attn: LessonModule<AttnState, AttnParams, AttnData> = {
  slug: "attention-transformers",
  defaultParams: ATTN_DEFAULTS,
  defaultData: { presetId: "pronoun", text: ATTN_PRESETS.pronoun },
  validate: (data) => validateSentence(data.text),
  run: (data, params) => runAttention(data.text, params),
  Scene,
  LabControls,
  code: { python, pseudo },
  stats: (frame) => [
    { labelKey: "words", value: frame.metrics.n },
    { labelKey: "top", value: SHOWN.includes(frame.state.stage) ? Math.round(frame.metrics.top * 1000) / 10 : undefined, suffix: "%" },
    { labelKey: "head", value: frame.metrics.head },
  ],
  // Every edit re-runs instantly and the trace always has the same seven steps, so stay on the current one.
  viewOnly: () => true,
};

export default attn;
