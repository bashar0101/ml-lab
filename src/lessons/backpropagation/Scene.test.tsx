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
const labels = { presets: { blobs: "Two groups", moons: "Moons", circles: "Rings" }, params: { depth: { label: "Hidden layers" }, learningRate: { label: "Learning rate" } } };

describe("backpropagation module", () => {
  it("is registered", () => {
    expect(hasLessonModule("backpropagation")).toBe(true);
  });

  it("forward shows values, backward shows blame from the right, grads label every edge", () => {
    const t = mod.run(mod.defaultData, mod.defaultParams);
    const at = (tag: string) => rewrap(<mod.Scene trace={t} index={frameIndexOfTag(t, tag)} data={mod.defaultData} reveal="all" />);
    const { container, rerender } = wrap(at("forward-out"));
    expect(container.querySelectorAll("[data-part=value]")).toHaveLength(2 + 3 + 1);
    expect(container.querySelectorAll("[data-part=blame]")).toHaveLength(0);
    rerender(at("backward-out"));
    expect(container.querySelectorAll("[data-part=blame]")).toHaveLength(1);
    rerender(at("backward-hidden"));
    expect(container.querySelectorAll("[data-part=blame]")).toHaveLength(1 + 3);
    rerender(at("grads"));
    expect(container.querySelectorAll("[data-part=edge-grad]")).toHaveLength(2 * 3 + 3);
  });

  it("epoch frames chart one gradient bar per layer", () => {
    const t = mod.run(mod.defaultData, { ...mod.defaultParams, depth: 4 });
    const { container } = wrap(<mod.Scene trace={t} index={t.frames.length - 1} data={mod.defaultData} reveal="all" />);
    expect(container.querySelectorAll("[data-part=grad-bar]")).toHaveLength(5);
    for (const el of container.querySelectorAll("*")) for (const a of el.attributes) expect(a.value).not.toMatch(/NaN|Infinity/);
  });

  it("every code line used exists in both tabs", () => {
    for (const f of mod.run(mod.defaultData, mod.defaultParams).frames) {
      expect(keys(mod.code.python)).toContain(f.codeLine);
      expect(keys(mod.code.pseudo)).toContain(f.codeLine);
    }
  });

  it("controls: depth and activation", async () => {
    const onParams = vi.fn();
    wrap(<mod.LabControls params={mod.defaultParams} data={mod.defaultData} onParams={onParams} onData={vi.fn()} labels={labels} />);
    await userEvent.click(screen.getByRole("button", { name: "Sigmoid" }));
    expect(onParams).toHaveBeenLastCalledWith({ ...mod.defaultParams, activation: "sigmoid" });
    expect(screen.getByLabelText(/Hidden layers/)).toHaveValue("1");
  });

  it("stats: prediction, loss of the example, last/first gradient ratio (only once training)", () => {
    const t = mod.run(mod.defaultData, mod.defaultParams);
    expect(mod.stats(t.frames[0], mod.defaultParams).map((s) => s.labelKey)).toEqual(["prediction", "loss", "ratio"]);
    expect(mod.stats(t.frames[0], mod.defaultParams)[2].value).toBeNull();
    expect(mod.stats(t.frames.at(-2)!, mod.defaultParams)[2].value).not.toBeNull();
  });
});
