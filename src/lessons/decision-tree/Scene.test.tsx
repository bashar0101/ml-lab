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
  presets: { blobs: "Two groups", overlap: "Overlapping", moons: "Moons", "three-blobs": "Three groups", xor: "Checkerboard" },
  params: { maxDepth: { label: "Max depth" }, minLeaf: { label: "Min points per leaf" } },
};

describe("decision tree module", () => {
  it("is registered", () => {
    expect(hasLessonModule("decision-tree")).toBe(true);
  });

  it("draws one diagram node per tree node and one region per leaf", () => {
    const t = mod.run(mod.defaultData, mod.defaultParams);
    const last = t.frames.at(-1)!;
    const { container } = wrap(<mod.Scene trace={t} index={t.frames.length - 1} data={mod.defaultData} reveal="all" />);
    expect(container.querySelectorAll("[data-part=tree-node]")).toHaveLength(last.metrics.nodes);
    expect(container.querySelectorAll("[data-part=region]")).toHaveLength(last.metrics.leaves);
    expect(container.querySelectorAll("[data-part=split-line]")).toHaveLength(last.metrics.nodes - last.metrics.leaves);
  });

  it("shows the candidate questions only on scan frames", () => {
    const t = mod.run(mod.defaultData, mod.defaultParams);
    const { container, rerender } = wrap(<mod.Scene trace={t} index={1} data={mod.defaultData} reveal="all" />);
    expect(container.querySelectorAll("[data-part=candidate]")).toHaveLength(t.frames[1].state.candidates.length);
    rerender(rewrap(<mod.Scene trace={t} index={2} data={mod.defaultData} reveal="all" />));
    expect(container.querySelectorAll("[data-part=candidate]")).toHaveLength(0);
  });

  it("reveal hides the tree diagram and regions", () => {
    const t = mod.run(mod.defaultData, mod.defaultParams);
    const { container } = wrap(<mod.Scene trace={t} index={2} data={mod.defaultData} reveal={new Set(["points", "splits"])} />);
    expect(container.querySelector("[data-part=tree-node]")).toBeNull();
    expect(container.querySelector("[data-part=region]")).toBeNull();
    expect(container.querySelector("[data-part=split-line]")).not.toBeNull();
  });

  it("a deep tree still renders without NaN", () => {
    const t = mod.run(mod.defaultData, { maxDepth: 8, minLeaf: 1 });
    const { container } = wrap(<mod.Scene trace={t} index={t.frames.length - 1} data={mod.defaultData} reveal="all" />);
    for (const el of container.querySelectorAll("*")) for (const a of el.attributes) expect(a.value).not.toMatch(/NaN|Infinity/);
  });

  it("every code line used exists in both tabs", () => {
    for (const f of mod.run(mod.defaultData, mod.defaultParams).frames) {
      expect(keys(mod.code.python)).toContain(f.codeLine);
      expect(keys(mod.code.pseudo)).toContain(f.codeLine);
    }
  });

  it("controls change depth and min leaf", async () => {
    const onParams = vi.fn();
    wrap(<mod.LabControls params={mod.defaultParams} data={mod.defaultData} onParams={onParams} onData={vi.fn()} labels={labels} />);
    expect(screen.getByLabelText(/Max depth/)).toHaveValue("3");
    expect(screen.getByLabelText(/Min points per leaf/)).toHaveValue("2");
    await userEvent.click(screen.getByRole("button", { name: "Checkerboard" }));
  });
});
