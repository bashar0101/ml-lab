import { describe, expect, it } from "vitest";
import { frameIndexOfTag } from "@/engine/types";
import neuralFixtures from "../neural-network/fixtures.json";
import { makeDataset, type LabeledPoint } from "../shared/datasets2d";
import { BP_DEFAULTS, runBackprop, validateBackprop } from "./algorithm";
import fixtures from "./fixtures.json";

const pts: LabeledPoint[] = neuralFixtures.points.map(([x, y, c]) => ({ x, y, c: c as 0 | 1 }));

describe("runBackprop", () => {
  it("one step on one example matches the reference: prediction, blame (dz) and new weights", () => {
    const t = runBackprop(pts, BP_DEFAULTS);
    const loss = t.frames[frameIndexOfTag(t, "loss")].state;
    expect(loss.fwd.a.at(-1)![0]).toBeCloseTo(fixtures.step.p, 12);
    const grads = t.frames[frameIndexOfTag(t, "grads")].state;
    grads.grad.dz.forEach((layer, l) => layer.forEach((v, j) => expect(v).toBeCloseTo(fixtures.step.dz[l][j], 12)));
    const upd = t.frames[frameIndexOfTag(t, "update")].state;
    upd.net.W.forEach((layer, l) => layer.forEach((row, j) => row.forEach((w, i) => expect(w).toBeCloseTo(fixtures.step.W_after[l][j][i], 12))));
  });

  it("walks forward left → right, loss, backward right → left, gradients, update, then epochs", () => {
    const t = runBackprop(pts, { ...BP_DEFAULTS, depth: 2 });
    const ev = t.frames.map((f) => f.event);
    expect(ev.slice(0, 7)).toEqual(["init", "forward", "forward", "forward", "loss", "backward", "backward"]);
    expect(ev.filter((e) => e === "backward")).toHaveLength(3);
    for (const tag of ["start", "forward-1", "forward-out", "loss", "backward-out", "backward-hidden", "grads", "update", "epochs", "done"])
      expect(frameIndexOfTag(t, tag), tag).toBeGreaterThanOrEqual(0);
    const backward = t.frames.filter((f) => f.event === "backward").map((f) => f.state.shownBackward);
    expect(backward).toEqual([1, 2, 3]);
  });

  it("story claim: in a deep sigmoid network the first layer's gradient is hundreds of times smaller than the last's", () => {
    const t = runBackprop(pts, { ...BP_DEFAULTS, depth: 5, activation: "sigmoid" });
    const first = t.frames.find((f) => f.event === "epoch")!.state.history[0];
    first.forEach((v, l) => expect(v).toBeCloseTo(fixtures.deepSigmoid[l], 12));
    expect(first.at(-1)! / first[0]).toBeGreaterThan(100);
  });

  it("with tanh and one hidden layer the gradients stay comparable", () => {
    const t = runBackprop(makeDataset("blobs"), BP_DEFAULTS);
    const g = t.frames.at(-1)!.state.history.at(-1)!;
    expect(g.at(-1)! / g[0]).toBeLessThan(20);
  });

  it("no NaN anywhere with a huge learning rate", () => {
    const t = runBackprop(pts, { ...BP_DEFAULTS, learningRate: 50, depth: 5 });
    for (const f of t.frames) for (const v of Object.values(f.metrics)) expect(Number.isNaN(v)).toBe(false);
  });
});

describe("validateBackprop", () => {
  it("needs four points of both classes", () => {
    expect(validateBackprop(pts.slice(0, 2))).toBe("tooFew");
    expect(validateBackprop(pts.filter((p) => p.c === 1))).toBe("oneClass");
    expect(validateBackprop(pts)).toBeNull();
  });
});
