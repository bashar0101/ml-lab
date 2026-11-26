import { makeDataset } from "../shared/datasets2d";
import type { LessonModule } from "../types";
import { runDecisionTree, TREE_DEFAULTS, validateTree, type TreeParams, type TreeState } from "./algorithm";
import { pseudo, python } from "./code";
import { LabControls } from "./LabControls";
import { Scene, type TreeData } from "./Scene";

const decisionTree: LessonModule<TreeState, TreeParams, TreeData> = {
  slug: "decision-tree",
  defaultParams: TREE_DEFAULTS,
  defaultData: { presetId: "moons", points: makeDataset("moons"), drawClass: 0 },
  validate: (data) => validateTree(data.points),
  run: (data, params) => runDecisionTree(data.points, params),
  Scene,
  LabControls,
  code: { python, pseudo },
  stats: (frame, params) => [
    { labelKey: "depth", value: frame.metrics.depth, suffix: params ? `/ ${params.maxDepth}` : undefined },
    { labelKey: "leaves", value: frame.metrics.leaves },
    { labelKey: "accuracy", value: Math.round(frame.metrics.accuracy * 1000) / 10, suffix: "%" },
  ],
};

export default decisionTree;
