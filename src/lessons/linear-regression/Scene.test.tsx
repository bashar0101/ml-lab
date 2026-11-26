import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import ui from "../../../content/en/ui.json";
import { UiProvider } from "@/i18n/ui-context";
import { hasLessonModule, loadLessonModule } from "../registry";
import type { CodeLine } from "../types";
import mod from "./index";

const wrap = (node: ReactNode) => render(<UiProvider strings={ui}>{node}</UiProvider>);
const keys = (ls: CodeLine[]) => new Set(ls.map((l) => l.key).filter(Boolean));

describe("linear regression module", () => {
  it("renders a diverged frame with no NaN or Infinity in any attribute", () => {
    const t = mod.run(mod.defaultData, { ...mod.defaultParams, learningRate: 50, steps: 200 });
    const { container } = wrap(<mod.Scene trace={t} index={t.frames.length - 1} data={mod.defaultData} reveal="all" />);
    for (const el of container.querySelectorAll("*"))
      for (const a of el.attributes) expect(a.value, `${el.tagName} ${a.name}`).not.toMatch(/NaN|Infinity/);
  });

  it("hides residuals and line until revealed", () => {
    const t = mod.run(mod.defaultData, mod.defaultParams);
    const { container } = wrap(<mod.Scene trace={t} index={0} data={mod.defaultData} reveal={new Set(["points"])} />);
    expect(container.querySelectorAll("[data-part=point]")).toHaveLength(9);
    expect(container.querySelector("[data-part=line]")).toBeNull();
    expect(container.querySelector("[data-part=residual]")).toBeNull();
    expect(container.querySelector("[data-part=bowl]")).toBeNull();
  });

  it("shows line, residuals, bowl, path and current dot when everything is revealed", () => {
    const t = mod.run(mod.defaultData, mod.defaultParams);
    const { container } = wrap(<mod.Scene trace={t} index={5} data={mod.defaultData} reveal="all" />);
    for (const part of ["line", "bowl", "path", "current"]) expect(container.querySelector(`[data-part=${part}]`), part).not.toBeNull();
    expect(container.querySelectorAll("[data-part=residual]")).toHaveLength(9);
    expect(screen.getByRole("img", { name: ui["lr.scene.label"] })).toBeInTheDocument();
  });

  it("the first, wrong-way guess is drawn inside the plot (y axis starts at 0 for non-negative data)", () => {
    const t = mod.run(mod.defaultData, mod.defaultParams);
    const { container } = wrap(<mod.Scene trace={t} index={0} data={mod.defaultData} reveal={new Set(["points", "line"])} />);
    const d = container.querySelector("[data-part=line]")!.getAttribute("d")!;
    const ys = [...d.matchAll(/[ML][\d.-]+ ([\d.-]+)/g)].map((m) => Number(m[1]));
    for (const y of ys) {
      expect(y).toBeGreaterThanOrEqual(46);
      expect(y).toBeLessThanOrEqual(330);
    }
  });

  it("a steep (diverging) line is clipped, not bent: the drawn segment has the model's true slope", () => {
    const t = mod.run(mod.defaultData, { ...mod.defaultParams, learningRate: 1.2 });
    const i = t.frames.findIndex((f) => Math.abs(f.metrics.slope) > 100 && Number.isFinite(f.metrics.slope));
    expect(i).toBeGreaterThan(0);
    const { container } = wrap(<mod.Scene trace={t} index={i} data={mod.defaultData} reveal="all" />);
    const nums = container.querySelector("[data-part=line]")!.getAttribute("d")!.match(/-?[\d.]+/g)!.map(Number);
    const [x1, y1, x2, y2] = nums;
    // plot maps x 0..10 → 62..360 and y 0..100 → 330..46
    const toX = (px: number) => ((px - 62) / 298) * 10;
    const toY = (py: number) => ((330 - py) / 284) * 100;
    const drawnSlope = (toY(y2) - toY(y1)) / (toX(x2) - toX(x1));
    expect(drawnSlope / t.frames[i].metrics.slope).toBeCloseTo(1, 2);
  });

  it("draw-your-own has a keyboard way to add and remove points", async () => {
    const onData = vi.fn();
    const labels = { presets: {}, params: { learningRate: { label: "Learning rate" }, steps: { label: "Steps" } } };
    const data = { presetId: "custom", points: [{ x: 2, y: 30 }] };
    wrap(<mod.LabControls params={mod.defaultParams} data={data} onParams={vi.fn()} onData={onData} labels={labels} />);
    await userEvent.type(screen.getByLabelText("x"), "4.5");
    await userEvent.type(screen.getByLabelText("y"), "60");
    await userEvent.click(screen.getByRole("button", { name: "Add point" }));
    expect(onData).toHaveBeenLastCalledWith({ presetId: "custom", points: [{ x: 2, y: 30 }, { x: 4.5, y: 60 }] });
    await userEvent.click(screen.getByRole("button", { name: "Remove point (2, 30)" }));
    expect(onData).toHaveBeenLastCalledWith({ presetId: "custom", points: [] });
  });

  it("the line and residuals don't swallow clicks meant for the drawing area", () => {
    const t = mod.run(mod.defaultData, mod.defaultParams);
    const { container } = wrap(<mod.Scene trace={t} index={5} data={mod.defaultData} reveal="all" />);
    expect(container.querySelector("[data-part=line]")).toHaveAttribute("pointer-events", "none");
    expect(container.querySelector("[data-part=residual]")).toHaveAttribute("pointer-events", "none");
  });

  it("every frame's codeLine exists in both code tabs", () => {
    const t = mod.run(mod.defaultData, mod.defaultParams);
    const diverged = mod.run(mod.defaultData, { ...mod.defaultParams, learningRate: 50 });
    for (const f of [...t.frames, ...diverged.frames]) {
      expect(keys(mod.code.python)).toContain(f.codeLine);
      expect(keys(mod.code.pseudo)).toContain(f.codeLine);
    }
  });

  it("loss stat is null (too big) on a diverged frame and a number otherwise", () => {
    const bad = mod.run(mod.defaultData, { ...mod.defaultParams, learningRate: 50, steps: 200 });
    expect(mod.stats(bad.frames.at(-1)!).find((s) => s.labelKey === "loss")!.value).toBeNull();
    const ok = mod.run(mod.defaultData, mod.defaultParams);
    expect(mod.stats(ok.frames[0]).map((s) => s.labelKey)).toEqual(["step", "loss", "slope"]);
    expect(mod.stats(ok.frames[0])[1].value).toBeCloseTo(ok.frames[0].metrics.loss);
  });

  it("validate returns content keys", () => {
    expect(mod.validate({ presetId: "custom", points: [] })).toBe("tooFew");
    expect(mod.validate(mod.defaultData)).toBeNull();
  });

  it("lab controls change presets and the learning rate", async () => {
    const onParams = vi.fn();
    const onData = vi.fn();
    const labels = { presets: { "study-hours": "Study hours", "house-prices": "House prices", outlier: "One outlier" }, params: { learningRate: { label: "Learning rate" }, steps: { label: "Steps" } } };
    wrap(<mod.LabControls params={mod.defaultParams} data={mod.defaultData} onParams={onParams} onData={onData} labels={labels} />);
    await userEvent.click(screen.getByRole("button", { name: "House prices" }));
    expect(onData).toHaveBeenCalledWith(expect.objectContaining({ presetId: "house-prices" }));
    expect(screen.getByRole("button", { name: "Study hours" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText(/Learning rate/)).toHaveValue("0.1");
  });
});

describe("registry", () => {
  it("loads linear-regression and knows what it lacks", async () => {
    expect((await loadLessonModule("linear-regression")).slug).toBe("linear-regression");
    expect(hasLessonModule("linear-regression")).toBe(true);
    expect(hasLessonModule("neural-network")).toBe(false);
  });
});

describe("typed points (linear regression)", () => {
  it("are kept inside the drawing grid (x 0–10, y 0–100)", async () => {
    const onData = vi.fn();
    const labels = { presets: {}, params: { learningRate: { label: "Learning rate" }, steps: { label: "Steps" } } };
    wrap(<mod.LabControls params={mod.defaultParams} data={{ presetId: "custom", points: [] }} onParams={vi.fn()} onData={onData} labels={labels} />);
    await userEvent.type(screen.getByLabelText("x"), "12");
    await userEvent.type(screen.getByLabelText("y"), "250");
    await userEvent.click(screen.getByRole("button", { name: "Add point" }));
    expect(onData).toHaveBeenLastCalledWith({ presetId: "custom", points: [{ x: 10, y: 100 }] });
  });
});
