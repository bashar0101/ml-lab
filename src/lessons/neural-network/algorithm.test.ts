import { describe, expect, it } from "vitest";
import { frameIndexOfTag } from "@/engine/types";
import { makeDataset, type LabeledPoint } from "../shared/datasets2d";
import { NN_DEFAULTS, runNeuralNet, validateNet } from "./algorithm";

describe("runNeuralNet", () => {
  const circles = makeDataset("circles");

  it("walks init → forward pass of one point → training snapshots → done", () => {
    const t = runNeuralNet(circles, NN_DEFAULTS);
    const events = t.frames.map((f) => f.event);
    expect(events.slice(0, 4)).toEqual(["init", "input", "hidden", "output"]);
    expect(events.at(-1)).toBe("done");
    for (const tag of ["start", "forward-input", "forward-hidden", "forward-output", "train-first", "train-half", "done"])
      expect(frameIndexOfTag(t, tag), tag).toBeGreaterThanOrEqual(0);
    expect(t.frames.length).toBeLessThanOrEqual(120);
  });

  it("one hidden layer per forward frame", () => {
    const t = runNeuralNet(circles, { ...NN_DEFAULTS, hidden: [4, 3, 2] });
    expect(t.frames.filter((f) => f.event === "hidden")).toHaveLength(3);
  });

  it("story claim: one neuron draws a straight line and fails on rings; eight neurons solve them", () => {
    const acc = (hidden: number[]) => runNeuralNet(circles, { ...NN_DEFAULTS, hidden }).frames.at(-1)!.metrics.accuracy;
    expect(acc([1])).toBeLessThan(0.8);
    expect(acc([8])).toBeGreaterThanOrEqual(0.95);
  });

  it("the default network learns the rings", () => {
    expect(runNeuralNet(circles, NN_DEFAULTS).frames.at(-1)!.metrics.accuracy).toBeGreaterThanOrEqual(0.9);
  });

  it("loss goes down over training", () => {
    const train = runNeuralNet(circles, NN_DEFAULTS).frames.filter((f) => f.event === "train");
    expect(train.at(-1)!.metrics.loss).toBeLessThan(train[0].metrics.loss);
  });

  it("never stores NaN, even with a huge learning rate", () => {
    const t = runNeuralNet(circles, { ...NN_DEFAULTS, learningRate: 50, hidden: [8, 8], activation: "relu" });
    for (const f of t.frames) for (const v of Object.values(f.metrics)) expect(Number.isNaN(v)).toBe(false);
  });
});

describe("validateNet", () => {
  it("needs four points of both classes", () => {
    expect(validateNet([])).toBe("tooFew");
    expect(validateNet(makeDataset("blobs").filter((p) => p.c === 0))).toBe("oneClass");
    expect(validateNet(makeDataset("blobs") as LabeledPoint[])).toBeNull();
  });
});
