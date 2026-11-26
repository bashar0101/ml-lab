import { fireEvent, render, screen } from "@testing-library/react";
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
const labels = { presets: {}, params: {} };

describe("cnn module", () => {
  it("is registered", () => {
    expect(hasLessonModule("convolutional-neural-network")).toBe(true);
  });

  it("conv frames show the sliding window and fill the feature map cell by cell", () => {
    const t = mod.run(mod.defaultData, mod.defaultParams);
    const i = frameIndexOfTag(t, "conv-first") + 9;
    const { container } = wrap(<mod.Scene trace={t} index={i} data={mod.defaultData} reveal="all" />);
    expect(container.querySelector("[data-part=window]")).not.toBeNull();
    expect(container.querySelectorAll("[data-part=feature-cell][data-filled=true]")).toHaveLength(10);
    expect(container.querySelectorAll("[data-part=pixel]")).toHaveLength(64);
  });

  it("the maps frame shows all four pooled maps; the dense frame shows ten probability bars", () => {
    const t = mod.run(mod.defaultData, mod.defaultParams);
    const { container, rerender } = wrap(<mod.Scene trace={t} index={frameIndexOfTag(t, "maps")} data={mod.defaultData} reveal="all" />);
    expect(container.querySelectorAll("[data-part=pooled-map]")).toHaveLength(4);
    rerender(rewrap(<mod.Scene trace={t} index={frameIndexOfTag(t, "dense")} data={mod.defaultData} reveal="all" />));
    expect(container.querySelectorAll("[data-part=prob-bar]")).toHaveLength(10);
  });

  it("clicking a pixel in the Lab toggles it", () => {
    const onData = vi.fn();
    const t = mod.run(mod.defaultData, mod.defaultParams);
    const { container } = wrap(<mod.Scene trace={t} index={0} data={mod.defaultData} reveal="all" onData={onData} />);
    fireEvent.click(container.querySelectorAll("[data-part=pixel]")[0]);
    const next = onData.mock.calls[0][0].image;
    expect(next[0][0]).toBe(1 - mod.defaultData.image[0][0]);
  });

  it("keyboard drawing: a grid of 64 toggle buttons, and digit presets", async () => {
    const onData = vi.fn();
    wrap(<mod.LabControls params={mod.defaultParams} data={mod.defaultData} onParams={vi.fn()} onData={onData} labels={labels} />);
    const cells = screen.getAllByRole("button", { name: /^Pixel row/ });
    expect(cells).toHaveLength(64);
    await userEvent.click(cells[9]);
    expect(onData.mock.calls.at(-1)![0].image[1][1]).toBe(1 - mod.defaultData.image[1][1]);
    await userEvent.click(screen.getByRole("button", { name: "Digit 4" }));
    expect(onData.mock.calls.at(-1)![0].presetId).toBe("4");
  });

  it("every code line used exists in both tabs", () => {
    for (const f of mod.run(mod.defaultData, mod.defaultParams).frames) {
      expect(keys(mod.code.python)).toContain(f.codeLine);
      expect(keys(mod.code.pseudo)).toContain(f.codeLine);
    }
  });
});
