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
const rewrap = (node: ReactNode) => <UiProvider strings={ui}>{node}</UiProvider>;
const keys = (ls: CodeLine[]) => new Set(ls.map((l) => l.key).filter(Boolean));
const labels = {
  presets: { "three-blobs": "Three groups", blobs: "Two groups", moons: "Moons", circles: "Rings", uneven: "Uneven" },
  params: { k: { label: "k (clusters)" } },
};

describe("k-means module", () => {
  it("is registered", () => {
    expect(hasLessonModule("k-means")).toBe(true);
  });

  it("points start uncoloured, then take their cluster's colour on assign", () => {
    const t = mod.run(mod.defaultData, mod.defaultParams);
    const { container, rerender } = wrap(<mod.Scene trace={t} index={0} data={mod.defaultData} reveal="all" />);
    expect(container.querySelectorAll("[data-part=point][data-cluster]")).toHaveLength(0);
    expect(container.querySelectorAll("[data-part=centroid]")).toHaveLength(mod.defaultParams.k);
    rerender(rewrap(<mod.Scene trace={t} index={1} data={mod.defaultData} reveal="all" />));
    expect(container.querySelectorAll("[data-part=point][data-cluster]")).toHaveLength(mod.defaultData.points.length);
    expect(container.querySelector("[data-part=regions]")).not.toBeNull();
  });

  it("shows centroid trails and the inertia chart after updates", () => {
    const t = mod.run(mod.defaultData, mod.defaultParams);
    const { container } = wrap(<mod.Scene trace={t} index={t.frames.length - 1} data={mod.defaultData} reveal="all" />);
    expect(container.querySelectorAll("[data-part=trail]")).toHaveLength(mod.defaultParams.k);
    expect(container.querySelector("[data-part=chart]")).not.toBeNull();
  });

  it("every code line used exists in both tabs", () => {
    for (const init of ["random", "plus-plus"] as const)
      for (const f of mod.run(mod.defaultData, { ...mod.defaultParams, init }).frames) {
        expect(keys(mod.code.python)).toContain(f.codeLine);
        expect(keys(mod.code.pseudo)).toContain(f.codeLine);
      }
  });

  it("controls: k, start method and a new random start", async () => {
    const onParams = vi.fn();
    wrap(<mod.LabControls params={mod.defaultParams} data={mod.defaultData} onParams={onParams} onData={vi.fn()} labels={labels} />);
    await userEvent.click(screen.getByRole("button", { name: "Smart start (k-means++)" }));
    expect(onParams).toHaveBeenLastCalledWith({ ...mod.defaultParams, init: "plus-plus" });
    await userEvent.click(screen.getByRole("button", { name: /New random start/ }));
    expect(onParams).toHaveBeenLastCalledWith({ ...mod.defaultParams, seed: mod.defaultParams.seed + 1 });
    expect(screen.getByLabelText(/k \(clusters\)/)).toHaveValue("3");
  });

  it("stats: iteration, inertia, points that moved", () => {
    const t = mod.run(mod.defaultData, mod.defaultParams);
    expect(mod.stats(t.frames[1], mod.defaultParams).map((s) => s.labelKey)).toEqual(["iteration", "inertia", "changed"]);
  });
});
