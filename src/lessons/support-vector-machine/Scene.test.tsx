import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import ui from "../../../content/en/ui.json";
import { UiProvider } from "@/i18n/ui-context";
import { hasLessonModule } from "../registry";
import { makeDataset } from "../shared/datasets2d";
import type { CodeLine } from "../types";
import mod from "./index";

const wrap = (node: ReactNode) => render(<UiProvider strings={ui}>{node}</UiProvider>);
const rewrap = (node: ReactNode) => <UiProvider strings={ui}>{node}</UiProvider>;
const keys = (ls: CodeLine[]) => new Set(ls.map((l) => l.key).filter(Boolean));
const labels = {
  presets: { blobs: "Two groups", overlap: "Overlapping", circles: "Rings", moons: "Moons" },
  params: { C: { label: "C (strictness)" }, gamma: { label: "Gamma (reach)" }, epochs: { label: "Epochs" } },
};

describe("support vector machine module", () => {
  it("is registered", () => {
    expect(hasLessonModule("support-vector-machine")).toBe(true);
  });

  it("draws the boundary, both margins, support vectors and the margin strip when revealed", () => {
    const t = mod.run(mod.defaultData, mod.defaultParams);
    const last = t.frames.length - 1;
    const { container, rerender } = wrap(<mod.Scene trace={t} index={last} data={mod.defaultData} reveal={new Set(["points"])} />);
    for (const part of ["boundary", "margin", "support", "strip", "shade"]) expect(container.querySelector(`[data-part=${part}]`), part).toBeNull();
    rerender(rewrap(<mod.Scene trace={t} index={last} data={mod.defaultData} reveal="all" />));
    for (const part of ["boundary", "shade", "strip"]) expect(container.querySelector(`[data-part=${part}]`), part).not.toBeNull();
    expect(container.querySelectorAll("[data-part=margin]").length).toBe(2);
    expect(container.querySelectorAll("[data-part=support]")).toHaveLength(t.frames[last].metrics.supports);
  });

  it("highlights the points that pushed on a pick frame", () => {
    const t = mod.run(mod.defaultData, mod.defaultParams);
    const { container } = wrap(<mod.Scene trace={t} index={1} data={mod.defaultData} reveal="all" />);
    expect(container.querySelectorAll("[data-part=picked]")).toHaveLength(t.frames[1].state.picked.length);
  });

  it("renders the RBF kernel on rings with no NaN", () => {
    const data = { ...mod.defaultData, presetId: "circles", points: makeDataset("circles") };
    const t = mod.run(data, { ...mod.defaultParams, kernel: "rbf", C: 10 });
    const { container } = wrap(<mod.Scene trace={t} index={t.frames.length - 1} data={data} reveal="all" />);
    for (const el of container.querySelectorAll("*")) for (const a of el.attributes) expect(a.value).not.toMatch(/NaN|Infinity/);
  });

  it("every code line used exists in both tabs", () => {
    for (const f of mod.run(mod.defaultData, mod.defaultParams).frames) {
      expect(keys(mod.code.python)).toContain(f.codeLine);
      expect(keys(mod.code.pseudo)).toContain(f.codeLine);
    }
  });

  it("controls: kernel switch shows the gamma slider only for RBF", async () => {
    const onParams = vi.fn();
    const { rerender } = wrap(
      <mod.LabControls params={mod.defaultParams} data={mod.defaultData} onParams={onParams} onData={vi.fn()} labels={labels} />,
    );
    expect(screen.queryByLabelText(/Gamma/)).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Curved (RBF)" }));
    expect(onParams).toHaveBeenLastCalledWith({ ...mod.defaultParams, kernel: "rbf" });
    rerender(rewrap(<mod.LabControls params={{ ...mod.defaultParams, kernel: "rbf" }} data={mod.defaultData} onParams={onParams} onData={vi.fn()} labels={labels} />));
    expect(screen.getByLabelText(/Gamma/)).toBeInTheDocument();
  });

  it("stats: epoch, accuracy, support vectors", () => {
    const t = mod.run(mod.defaultData, mod.defaultParams);
    expect(mod.stats(t.frames.at(-1)!, mod.defaultParams).map((s) => s.labelKey)).toEqual(["epoch", "accuracy", "supports"]);
  });
});
