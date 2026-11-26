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
const labels = { presets: { ellipse: "Stretched", round: "Round", stripes: "Two stripes", "three-blobs": "Three groups" }, params: {} };

describe("pca module", () => {
  it("is registered", () => {
    expect(hasLessonModule("pca")).toBe(true);
  });

  it("sweep frames show the direction, the shadows and the growing curve", () => {
    const t = mod.run(mod.defaultData, mod.defaultParams);
    const i = frameIndexOfTag(t, "sweep") + 5;
    const { container } = wrap(<mod.Scene trace={t} index={i} data={mod.defaultData} reveal="all" />);
    expect(container.querySelector("[data-part=direction]")).not.toBeNull();
    expect(container.querySelectorAll("[data-part=projection]")).toHaveLength(mod.defaultData.points.length);
    expect(container.querySelectorAll("[data-part=curve-point]")).toHaveLength(6);
  });

  it("shows both component arrows after PC2 and squashed points on project (1 component)", () => {
    const t = mod.run(mod.defaultData, mod.defaultParams);
    const { container, rerender } = wrap(<mod.Scene trace={t} index={frameIndexOfTag(t, "pc2")} data={mod.defaultData} reveal="all" />);
    expect(container.querySelectorAll("[data-part=axis]")).toHaveLength(2);
    rerender(rewrap(<mod.Scene trace={t} index={frameIndexOfTag(t, "project")} data={mod.defaultData} reveal="all" />));
    expect(container.querySelectorAll("[data-part=projected]")).toHaveLength(mod.defaultData.points.length);
    expect(container.querySelector("[data-part=explained]")).not.toBeNull();
  });

  it("with two components nothing is squashed", () => {
    const t = mod.run(mod.defaultData, { components: 2 });
    const { container } = wrap(<mod.Scene trace={t} index={frameIndexOfTag(t, "project")} data={mod.defaultData} reveal="all" />);
    expect(container.querySelectorAll("[data-part=projected]")).toHaveLength(0);
  });

  it("identical points render without NaN", () => {
    const data = { presetId: "custom", points: [{ x: 4, y: 4, c: 0 as const }, { x: 4, y: 4, c: 0 as const }], drawClass: 0 as const };
    const t = mod.run(data, mod.defaultParams);
    const { container } = wrap(<mod.Scene trace={t} index={t.frames.length - 1} data={data} reveal="all" />);
    for (const el of container.querySelectorAll("*")) for (const a of el.attributes) expect(a.value).not.toMatch(/NaN|Infinity/);
  });

  it("every code line used exists in both tabs", () => {
    for (const f of mod.run(mod.defaultData, mod.defaultParams).frames) {
      expect(keys(mod.code.python)).toContain(f.codeLine);
      expect(keys(mod.code.pseudo)).toContain(f.codeLine);
    }
  });

  it("the components switch is view-only", async () => {
    const onParams = vi.fn();
    wrap(<mod.LabControls params={mod.defaultParams} data={mod.defaultData} onParams={onParams} onData={vi.fn()} labels={labels} />);
    await userEvent.click(screen.getByRole("button", { name: "Keep both directions" }));
    expect(onParams).toHaveBeenLastCalledWith({ components: 2 });
    expect(mod.viewOnly?.({ components: 1 }, { components: 2 })).toBe(true);
  });

  it("stats: angle, spread along it, share kept", () => {
    const t = mod.run(mod.defaultData, mod.defaultParams);
    expect(mod.stats(t.frames.at(-1)!, mod.defaultParams).map((s) => s.labelKey)).toEqual(["angle", "spread", "kept"]);
  });
});
