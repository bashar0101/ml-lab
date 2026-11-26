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
  presets: { blobs: "Two groups", overlap: "Overlapping", circles: "Rings" },
  params: { learningRate: { label: "Learning rate" }, steps: { label: "Steps" }, threshold: { label: "Threshold" } },
};

describe("logistic regression module", () => {
  it("is registered and its default data is valid", () => {
    expect(hasLessonModule("logistic-regression")).toBe(true);
    expect(mod.validate(mod.defaultData)).toBeNull();
    expect(mod.validate({ ...mod.defaultData, points: mod.defaultData.points.filter((p) => p.c === 1) })).toBe("oneClass");
  });

  it("reveal controls shading, boundary and the sigmoid panel", () => {
    const t = mod.run(mod.defaultData, mod.defaultParams);
    const { container, rerender } = wrap(<mod.Scene trace={t} index={4} data={mod.defaultData} reveal={new Set(["points"])} />);
    expect(container.querySelectorAll("[data-part=point]").length).toBe(mod.defaultData.points.length);
    for (const part of ["shade", "boundary", "sigmoid"]) expect(container.querySelector(`[data-part=${part}]`), part).toBeNull();
    rerender(
      <UiProvider strings={ui}>
        <mod.Scene trace={t} index={4} data={mod.defaultData} reveal="all" />
      </UiProvider>,
    );
    for (const part of ["shade", "boundary", "sigmoid"]) expect(container.querySelector(`[data-part=${part}]`), part).not.toBeNull();
    expect(screen.getByRole("img", { name: ui["log.scene.label"] })).toBeInTheDocument();
  });

  it("rings misclassified points once predictions exist", () => {
    const t = mod.run(mod.defaultData, mod.defaultParams);
    const { container } = wrap(<mod.Scene trace={t} index={t.frames.length - 1} data={mod.defaultData} reveal="all" />);
    const wrong = t.frames.at(-1)!.state.probs.filter((p, i) => (p >= 0.5 ? 1 : 0) !== mod.defaultData.points[i].c).length;
    expect(container.querySelectorAll("[data-part=point][data-wrong=true]")).toHaveLength(wrong);
  });

  it("renders a blown-up run with no NaN or Infinity", () => {
    const t = mod.run(mod.defaultData, { ...mod.defaultParams, learningRate: 5, steps: 200 });
    const { container } = wrap(<mod.Scene trace={t} index={t.frames.length - 1} data={mod.defaultData} reveal="all" />);
    for (const el of container.querySelectorAll("*"))
      for (const a of el.attributes) expect(a.value, `${el.tagName} ${a.name}`).not.toMatch(/NaN|Infinity/);
  });

  it("every code line used exists in both tabs", () => {
    const t = mod.run(mod.defaultData, mod.defaultParams);
    for (const f of t.frames) {
      expect(keys(mod.code.python)).toContain(f.codeLine);
      expect(keys(mod.code.pseudo)).toContain(f.codeLine);
    }
  });

  it("controls change the threshold and pick a preset", async () => {
    const onParams = vi.fn();
    const onData = vi.fn();
    wrap(<mod.LabControls params={mod.defaultParams} data={mod.defaultData} onParams={onParams} onData={onData} labels={labels} />);
    await userEvent.click(screen.getByRole("button", { name: "Rings" }));
    expect(onData).toHaveBeenLastCalledWith(expect.objectContaining({ presetId: "circles" }));
    expect(screen.getByLabelText(/Threshold/)).toHaveValue("0.5");
  });

  it("stats: step, loss and accuracy (as a percentage)", () => {
    const t = mod.run(mod.defaultData, mod.defaultParams);
    const s = mod.stats(t.frames.at(-1)!, mod.defaultParams);
    expect(s.map((c) => c.labelKey)).toEqual(["step", "loss", "accuracy"]);
    expect(s[2].value).toBeCloseTo(t.frames.at(-1)!.metrics.accuracy * 100, 9);
    expect(s[2].suffix).toBe("%");
  });
});
