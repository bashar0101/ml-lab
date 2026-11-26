import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ui from "../../../content/en/ui.json";
import { UiProvider } from "@/i18n/ui-context";
import { hasLessonModule } from "../registry";
import type { CodeLine } from "../types";
import mod from "./index";

const wrap = (node: ReactNode) => render(<UiProvider strings={ui}>{node}</UiProvider>);
const rewrap = (node: ReactNode) => <UiProvider strings={ui}>{node}</UiProvider>;
const keys = (ls: CodeLine[]) => new Set(ls.map((l) => l.key).filter(Boolean));
const labels = {
  presets: { blobs: "Two groups", overlap: "Overlapping", moons: "Moons", "three-blobs": "Three groups" },
  params: { k: { label: "k (neighbours)" } },
};

afterEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (SVGElement.prototype as any).getScreenCTM;
});

describe("k-nearest neighbors module", () => {
  it("is registered", () => {
    expect(hasLessonModule("k-nearest-neighbors")).toBe(true);
  });

  it("each step reveals its part: distances, nearest ring, votes, map", () => {
    const t = mod.run(mod.defaultData, mod.defaultParams);
    const at = (i: number) => rewrap(<mod.Scene trace={t} index={i} data={mod.defaultData} reveal="all" />);
    const { container, rerender } = wrap(at(0));
    expect(container.querySelector("[data-part=query]")).not.toBeNull();
    expect(container.querySelectorAll("[data-part=distance]")).toHaveLength(0);
    rerender(at(1));
    expect(container.querySelectorAll("[data-part=distance]")).toHaveLength(mod.defaultData.points.length);
    rerender(at(2));
    expect(container.querySelectorAll("[data-part=neighbour]")).toHaveLength(mod.defaultParams.k);
    expect(container.querySelector("[data-part=radius]")!.tagName.toLowerCase()).toBe("circle");
    rerender(at(3));
    expect(container.querySelector("[data-part=votes]")).not.toBeNull();
    rerender(at(5));
    expect(container.querySelectorAll("[data-part=map] rect")).toHaveLength(28 * 28);
  });

  it("manhattan distance draws a diamond", () => {
    const t = mod.run(mod.defaultData, { ...mod.defaultParams, metric: "manhattan" });
    const { container } = wrap(<mod.Scene trace={t} index={2} data={mod.defaultData} reveal="all" />);
    expect(container.querySelector("[data-part=radius]")!.tagName.toLowerCase()).toBe("polygon");
  });

  it("in the Lab a click on the chart moves the new point", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (SVGElement.prototype as any).getScreenCTM = () => ({ inverse: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }) });
    const onData = vi.fn();
    const t = mod.run(mod.defaultData, mod.defaultParams);
    const { container } = wrap(<mod.Scene trace={t} index={0} data={mod.defaultData} reveal="all" onData={onData} />);
    fireEvent.click(container.querySelector("[data-part=plot-area]")!, { clientX: 50 + 316 / 2, clientY: 34 + 316 / 2 });
    expect(onData).toHaveBeenCalledWith(expect.objectContaining({ query: { x: 5, y: 5 } }));
  });

  it("every code line used exists in both tabs", () => {
    for (const f of mod.run(mod.defaultData, mod.defaultParams).frames) {
      expect(keys(mod.code.python)).toContain(f.codeLine);
      expect(keys(mod.code.pseudo)).toContain(f.codeLine);
    }
  });

  it("controls: k, metric, and typing the new point's position keep the data's query", async () => {
    const onParams = vi.fn();
    const onData = vi.fn();
    wrap(<mod.LabControls params={mod.defaultParams} data={mod.defaultData} onParams={onParams} onData={onData} labels={labels} />);
    await userEvent.click(screen.getByRole("button", { name: "Manhattan" }));
    expect(onParams).toHaveBeenLastCalledWith({ ...mod.defaultParams, metric: "manhattan" });
    await userEvent.click(screen.getByRole("button", { name: "Moons" }));
    expect(onData).toHaveBeenLastCalledWith(expect.objectContaining({ presetId: "moons", query: mod.defaultData.query }));
    const qx = screen.getByLabelText("New point x");
    await userEvent.clear(qx);
    await userEvent.type(qx, "2");
    await userEvent.click(screen.getByRole("button", { name: "Move the new point" }));
    expect(onData).toHaveBeenLastCalledWith(expect.objectContaining({ query: { x: 2, y: mod.defaultData.query.y } }));
  });

  it("stats: k, nearest distance, winning votes", () => {
    const t = mod.run(mod.defaultData, mod.defaultParams);
    expect(mod.stats(t.frames.at(-1)!, mod.defaultParams).map((s) => s.labelKey)).toEqual(["k", "nearest", "votes"]);
  });
});
