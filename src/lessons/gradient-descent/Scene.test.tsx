import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import ui from "../../../content/en/ui.json";
import { UiProvider } from "@/i18n/ui-context";
import { hasLessonModule } from "../registry";
import type { CodeLine } from "../types";
import mod from "./index";

const wrap = (node: ReactNode) => render(<UiProvider strings={ui}>{node}</UiProvider>);
const keys = (ls: CodeLine[]) => new Set(ls.map((l) => l.key).filter(Boolean));
const labels = {
  presets: { bowl: "Bowl", ravine: "Ravine", saddle: "Saddle", "two-valleys": "Two valleys" },
  params: { learningRate: { label: "Learning rate" }, steps: { label: "Steps" } },
};

describe("gradient descent module", () => {
  it("is registered", () => {
    expect(hasLessonModule("gradient-descent")).toBe(true);
  });

  it("renders a diverged frame with no NaN or Infinity in any attribute", () => {
    const t = mod.run(mod.defaultData, { ...mod.defaultParams, learningRate: 0.5, steps: 120 });
    expect(t.frames.at(-1)!.event).toBe("diverged");
    const { container } = wrap(<mod.Scene trace={t} index={t.frames.length - 1} data={mod.defaultData} reveal="all" />);
    for (const el of container.querySelectorAll("*"))
      for (const a of el.attributes) expect(a.value, `${el.tagName} ${a.name}`).not.toMatch(/NaN|Infinity/);
  });

  it("reveal controls the arrow, path and chart", () => {
    const t = mod.run(mod.defaultData, mod.defaultParams);
    const { container, rerender } = wrap(<mod.Scene trace={t} index={1} data={mod.defaultData} reveal={new Set(["surface", "ball"])} />);
    expect(container.querySelector("[data-part=ball]")).not.toBeNull();
    for (const part of ["arrow", "path", "chart"]) expect(container.querySelector(`[data-part=${part}]`), part).toBeNull();
    rerender(
      <UiProvider strings={ui}>
        <mod.Scene trace={t} index={1} data={mod.defaultData} reveal="all" />
      </UiProvider>,
    );
    for (const part of ["arrow", "path", "chart", "contour"]) expect(container.querySelector(`[data-part=${part}]`), part).not.toBeNull();
  });

  it("shows a legend and three balls only when comparing", () => {
    const one = mod.run(mod.defaultData, mod.defaultParams);
    const { container, rerender } = wrap(<mod.Scene trace={one} index={4} data={mod.defaultData} reveal="all" />);
    expect(container.querySelector("[data-part=legend]")).toBeNull();
    expect(container.querySelectorAll("[data-part=ball]")).toHaveLength(1);
    const three = mod.run(mod.defaultData, { ...mod.defaultParams, compare: true });
    rerender(
      <UiProvider strings={ui}>
        <mod.Scene trace={three} index={4} data={mod.defaultData} reveal="all" />
      </UiProvider>,
    );
    expect(container.querySelector("[data-part=legend]")).not.toBeNull();
    expect(container.querySelectorAll("[data-part=ball]")).toHaveLength(3);
  });

  it("every code line used by any optimizer exists in both tabs", () => {
    for (const optimizer of ["plain", "momentum", "adam"] as const) {
      const t = mod.run(mod.defaultData, { ...mod.defaultParams, optimizer });
      for (const f of t.frames) {
        expect(keys(mod.code.python)).toContain(f.codeLine);
        expect(keys(mod.code.pseudo)).toContain(f.codeLine);
      }
    }
  });

  it("switching surface applies its learning rate and resets the start point", async () => {
    const onParams = vi.fn();
    const onData = vi.fn();
    wrap(<mod.LabControls params={mod.defaultParams} data={{ start: [1, 1] }} onParams={onParams} onData={onData} labels={labels} />);
    await userEvent.click(screen.getByRole("button", { name: "Two valleys" }));
    expect(onParams).toHaveBeenLastCalledWith(expect.objectContaining({ surface: "two-valleys", learningRate: 0.05 }));
    expect(onData).toHaveBeenLastCalledWith({ start: null });
    await userEvent.click(screen.getByRole("button", { name: "Momentum" }));
    expect(onParams).toHaveBeenLastCalledWith(expect.objectContaining({ optimizer: "momentum" }));
    await userEvent.click(screen.getByRole("checkbox", { name: /Compare all three/ }));
    expect(onParams).toHaveBeenLastCalledWith(expect.objectContaining({ compare: true }));
  });

  it("stats: step, height (too big when blown up), slope", () => {
    const bad = mod.run(mod.defaultData, { ...mod.defaultParams, learningRate: 0.5, steps: 120 });
    const s = mod.stats(bad.frames.at(-1)!, mod.defaultParams);
    expect(s.map((c) => c.labelKey)).toEqual(["step", "height", "slope"]);
    expect(s[1].value).toBeNull();
  });
});

describe("keyboard start point", () => {
  it("typing a start point sets it, clamped to the map", async () => {
    const onData = vi.fn();
    wrap(<mod.LabControls params={mod.defaultParams} data={{ start: null }} onParams={vi.fn()} onData={onData} labels={labels} />);
    await userEvent.type(screen.getByLabelText("Start x"), "1.5");
    await userEvent.type(screen.getByLabelText("Start y"), "-9");
    await userEvent.click(screen.getByRole("button", { name: "Set start" }));
    expect(onData).toHaveBeenLastCalledWith({ start: [1.5, -3] });
  });
});
