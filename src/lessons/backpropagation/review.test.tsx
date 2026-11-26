import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import content from "../../../content/en/lessons/backpropagation.json";
import ui from "../../../content/en/ui.json";
import { UiProvider } from "@/i18n/ui-context";
import { makeDataset } from "../shared/datasets2d";
import { forward } from "../shared/mlp";
import { BP_DEFAULTS, runBackprop } from "./algorithm";
import mod from "./index";

const DATASETS = ["blobs", "moons", "circles"] as const;
const deep = (activation: "sigmoid" | "tanh" | "relu", seed = 1) => ({ ...BP_DEFAULTS, depth: 5, activation, seed });
const ratio = (row: number[]) => row.at(-1)! / row[0];

describe("backprop review fixes", () => {
  it("training frames show the prediction, loss and values of the network that is drawn", () => {
    const t = runBackprop(makeDataset("blobs"), BP_DEFAULTS);
    const epochs = t.frames.filter((f) => f.event === "epoch" || f.event === "done");
    const L = t.frames[0].state.net.W.length;
    for (const f of epochs) {
      const p = forward(f.state.net, f.state.x).a[L][0];
      expect(f.metrics.prediction).toBeCloseTo(p, 12);
      expect(f.state.fwd.a[L][0]).toBeCloseTo(p, 12);
      const y = f.state.y;
      expect(f.metrics.loss).toBeCloseTo(-(y * Math.log(p) + (1 - y) * Math.log(1 - p)), 9);
    }
    // Training actually moves the example's prediction.
    expect(Math.abs(epochs.at(-1)!.metrics.prediction - t.frames[0].metrics.prediction)).toBeGreaterThan(0.1);
  });

  it("break it: 5 sigmoid layers, first epoch: the first layer's gradient is hundreds of times smaller, on every lesson dataset", () => {
    for (const ds of DATASETS) {
      const h = runBackprop(makeDataset(ds), deep("sigmoid")).frames.at(-1)!.state.history;
      expect(ratio(h[0]), ds).toBeGreaterThan(300);
    }
  });

  it("break it: then every sigmoid gradient falls below 0.001 (the network stalls)", () => {
    for (const ds of DATASETS)
      for (const seed of [1, 2, 3]) {
        const h = runBackprop(makeDataset(ds), deep("sigmoid", seed)).frames.at(-1)!.state.history;
        expect(Math.max(...h.at(-1)!), `${ds} seed ${seed}`).toBeLessThan(1e-3);
      }
  });

  it("break it: with tanh, and with ReLU at the default weights, the first-epoch bars stay within 10× of each other", () => {
    for (const ds of DATASETS) {
      for (const act of ["tanh", "relu"] as const) {
        const h = runBackprop(makeDataset(ds), deep(act)).frames.at(-1)!.state.history;
        const r = ratio(h[0]);
        expect(r, `${act} ${ds}`).toBeGreaterThan(0.1);
        expect(r, `${act} ${ds}`).toBeLessThan(10);
      }
      for (const seed of [2, 3]) {
        const h = runBackprop(makeDataset(ds), deep("tanh", seed)).frames.at(-1)!.state.history;
        expect(ratio(h[0])).toBeLessThan(10);
      }
    }
  });

  it("break it: one press of New random weights (seed 2) kills the 5-layer ReLU network on every dataset", () => {
    for (const ds of DATASETS) {
      const h = runBackprop(makeDataset(ds), deep("relu", 2)).frames.at(-1)!.state.history;
      expect(h.flat().every((g) => g === 0), ds).toBe(true);
    }
    expect(content.lab.breakIt).toContain("**New random weights** once and it dies");
  });

  it("a dead ReLU network has every gradient exactly 0, shown as '—', not '0×'", () => {
    const t = runBackprop(makeDataset("blobs"), deep("relu", 2));
    const last = t.frames.at(-1)!;
    expect(last.state.history.flat().every((g) => g === 0)).toBe(true);
    const epoch = t.frames.find((f) => f.event === "epoch")!;
    expect(Number.isNaN(epoch.metrics.ratio)).toBe(true);
    expect(mod.stats(epoch).find((c) => c.labelKey === "ratio")!.value).toBeUndefined();
  });

  it("a huge ratio shows as 'too big' on the chip", () => {
    const fake = { ...runBackprop(makeDataset("blobs"), BP_DEFAULTS).frames.find((f) => f.event === "epoch")! };
    fake.metrics = { ...fake.metrics, ratio: 3.7e16 };
    expect(mod.stats(fake).find((c) => c.labelKey === "ratio")!.value).toBeNull();
  });

  it("the chart draws the first epoch as outlines next to the latest bars, all inside the picture", () => {
    const t = runBackprop(makeDataset("blobs"), { ...BP_DEFAULTS, depth: 2, activation: "relu", learningRate: 10, seed: 2 });
    const { container } = render(
      <UiProvider strings={ui}>
        <mod.Scene trace={t} index={t.frames.length - 1} data={mod.defaultData} reveal="all" />
      </UiProvider>,
    );
    const ghosts = container.querySelectorAll("[data-part=grad-ghost]");
    expect(ghosts).toHaveLength(3);
    for (const el of [...ghosts, ...container.querySelectorAll("[data-part=grad-bar] rect")]) {
      expect(Number(el.getAttribute("x")) + Number(el.getAttribute("width"))).toBeLessThanOrEqual(780);
    }
  });

  it("the text describes the first epoch and the stall, not 'similar sizes mean every layer is learning'", () => {
    expect(content.lab.breakIt).toMatch(/first epoch/);
    expect(content.lab.breakIt).toMatch(/0\.001/);
    expect(content.events.done.body).not.toMatch(/every layer is learning/);
    const fading = content.story.find((s) => s.id === "fading")!;
    expect(fading.body).toMatch(/first epoch/);
  });
});
