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
  presets: { overlap: "Overlapping", moons: "Moons", xor: "Checkerboard", circles: "Rings" },
  params: { trees: { label: "Trees" }, maxDepth: { label: "Max depth" } },
};

describe("random forest module", () => {
  it("is registered", () => {
    expect(hasLessonModule("random-forest")).toBe(true);
  });

  it("sample frames show draw counts and dim the points left out", () => {
    const t = mod.run(mod.defaultData, mod.defaultParams);
    const counts = t.frames[1].state.counts;
    const { container } = wrap(<mod.Scene trace={t} index={1} data={mod.defaultData} reveal="all" />);
    expect(container.querySelectorAll("[data-part=count-badge]")).toHaveLength(counts.filter((c) => c > 1).length);
    expect(container.querySelectorAll("[data-part=point][data-left-out=true]")).toHaveLength(counts.filter((c) => c === 0).length);
  });

  it("grow frames show that single tree; vote frames show the forest; thumbnails grow up to nine", () => {
    const t = mod.run(mod.defaultData, mod.defaultParams);
    const { container, rerender } = wrap(<mod.Scene trace={t} index={2} data={mod.defaultData} reveal="all" />);
    expect(container.querySelector("[data-part=tree-map]")).not.toBeNull();
    expect(container.querySelector("[data-part=forest-map]")).toBeNull();
    rerender(rewrap(<mod.Scene trace={t} index={3} data={mod.defaultData} reveal="all" />));
    expect(container.querySelector("[data-part=forest-map]")).not.toBeNull();
    expect(container.querySelectorAll("[data-part=thumb]")).toHaveLength(1);
    rerender(rewrap(<mod.Scene trace={t} index={t.frames.length - 1} data={mod.defaultData} reveal="all" />));
    expect(container.querySelectorAll("[data-part=thumb]")).toHaveLength(9);
  });

  it("every code line used exists in both tabs", () => {
    for (const f of mod.run(mod.defaultData, mod.defaultParams).frames) {
      expect(keys(mod.code.python)).toContain(f.codeLine);
      expect(keys(mod.code.pseudo)).toContain(f.codeLine);
    }
  });

  it("controls: trees and depth sliders, and a new random seed", async () => {
    const onParams = vi.fn();
    wrap(<mod.LabControls params={mod.defaultParams} data={mod.defaultData} onParams={onParams} onData={vi.fn()} labels={labels} />);
    expect(screen.getByLabelText(/Trees/)).toHaveValue("15");
    await userEvent.click(screen.getByRole("button", { name: /New random forest/ }));
    expect(onParams).toHaveBeenLastCalledWith({ ...mod.defaultParams, seed: mod.defaultParams.seed + 1 });
  });

  it("stats: trees, training accuracy, out-of-bag accuracy (not yet before any tree)", () => {
    const t = mod.run(mod.defaultData, mod.defaultParams);
    expect(mod.stats(t.frames[0], mod.defaultParams).map((s) => s.labelKey)).toEqual(["trees", "accuracy", "oob"]);
    expect(mod.stats(t.frames[0], mod.defaultParams)[2].value).toBeUndefined();
    expect(mod.stats(t.frames.at(-1)!, mod.defaultParams)[2].value).not.toBeNull();
  });
});
