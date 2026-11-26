import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import ui from "../../../content/en/ui.json";
import { UiProvider } from "@/i18n/ui-context";
import { frameIndexOfTag } from "@/engine/types";
import { hasLessonModule } from "../registry";
import type { CodeLine } from "../types";
import mod from "./index";

const wrap = (node: ReactNode) => render(<UiProvider strings={ui}>{node}</UiProvider>);
const rewrap = (node: ReactNode) => <UiProvider strings={ui}>{node}</UiProvider>;
const keys = (ls: CodeLine[]) => new Set(ls.map((l) => l.key).filter(Boolean));
const labels = {
  presets: { circles: "Rings", moons: "Moons", xor: "Checkerboard", blobs: "Two groups", overlap: "Overlapping" },
  params: { layers: { label: "Hidden layers" }, neurons: { label: "Neurons per layer" }, learningRate: { label: "Learning rate" }, epochs: { label: "Epochs" } },
};

describe("neural network module", () => {
  it("is registered", () => {
    expect(hasLessonModule("neural-network")).toBe(true);
  });

  it("draws one node per neuron and one edge per weight", () => {
    const p = { ...mod.defaultParams, hidden: [4, 3] };
    const t = mod.run(mod.defaultData, p);
    const { container } = wrap(<mod.Scene trace={t} index={0} data={mod.defaultData} reveal="all" />);
    expect(container.querySelectorAll("[data-part=node]")).toHaveLength(2 + 4 + 3 + 1);
    expect(container.querySelectorAll("[data-part=edge]")).toHaveLength(2 * 4 + 4 * 3 + 3 * 1);
  });

  it("the forward pass reveals values layer by layer for the probe point", () => {
    const t = mod.run(mod.defaultData, mod.defaultParams);
    const at = (tag: string) => rewrap(<mod.Scene trace={t} index={frameIndexOfTag(t, tag)} data={mod.defaultData} reveal="all" />);
    const { container, rerender } = wrap(at("forward-input"));
    expect(container.querySelectorAll("[data-part=node-value]")).toHaveLength(2);
    expect(container.querySelector("[data-part=probe]")).not.toBeNull();
    rerender(at("forward-output"));
    expect(container.querySelectorAll("[data-part=node-value]")).toHaveLength(2 + 4 + 1);
  });

  it("shades the plane by the network's probability", () => {
    const t = mod.run(mod.defaultData, mod.defaultParams);
    const { container } = wrap(<mod.Scene trace={t} index={t.frames.length - 1} data={mod.defaultData} reveal="all" />);
    expect(container.querySelectorAll("[data-part=shade] rect")).toHaveLength(28 * 28);
    for (const el of container.querySelectorAll("*")) for (const a of el.attributes) expect(a.value).not.toMatch(/NaN|Infinity/);
  });

  it("every code line used exists in both tabs", () => {
    for (const f of mod.run(mod.defaultData, mod.defaultParams).frames) {
      expect(keys(mod.code.python)).toContain(f.codeLine);
      expect(keys(mod.code.pseudo)).toContain(f.codeLine);
    }
  });

  it("controls: layers × neurons build the hidden sizes; activation chips", async () => {
    const onParams = vi.fn();
    wrap(<mod.LabControls params={mod.defaultParams} data={mod.defaultData} onParams={onParams} onData={vi.fn()} labels={labels} />);
    await userEvent.click(screen.getByRole("button", { name: "ReLU" }));
    expect(onParams).toHaveBeenLastCalledWith({ ...mod.defaultParams, activation: "relu" });
    expect(screen.getByLabelText(/Hidden layers/)).toHaveValue("1");
    expect(screen.getByLabelText(/Neurons per layer/)).toHaveValue("4");
  });

  it("stats: epoch, loss, accuracy", () => {
    const t = mod.run(mod.defaultData, mod.defaultParams);
    expect(mod.stats(t.frames.at(-1)!, mod.defaultParams).map((s) => s.labelKey)).toEqual(["epoch", "loss", "accuracy"]);
  });
});
