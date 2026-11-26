import { fireEvent, render, screen } from "@testing-library/react";
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
const labels = { presets: { short: "Short", medium: "Medium", long: "Long" }, params: { memory: { label: "Memory strength" } } };

describe("rnn module", () => {
  it("is registered", () => {
    expect(hasLessonModule("recurrent-neural-network")).toBe(true);
  });

  it("one column per letter; hidden states appear as letters are read", () => {
    const t = mod.run(mod.defaultData, mod.defaultParams);
    const n = mod.defaultData.text.length;
    const { container, rerender } = wrap(<mod.Scene trace={t} index={2} data={mod.defaultData} reveal="all" />);
    expect(container.querySelectorAll("[data-part=letter]")).toHaveLength(n);
    expect(container.querySelectorAll("[data-part=hidden][data-read=true]")).toHaveLength(2);
    rerender(rewrap(<mod.Scene trace={t} index={t.frames.length - 1} data={mod.defaultData} reveal="all" />));
    expect(container.querySelectorAll("[data-part=hidden][data-read=true]")).toHaveLength(n);
    expect(container.querySelector("[data-part=answer]")).not.toBeNull();
    expect(container.querySelectorAll("[data-part=chart-point]")).toHaveLength(6);
  });

  it("a 40-letter string still fits without NaN", () => {
    const data = { presetId: "custom", text: "a" + "cdefgh".repeat(7).slice(0, 39) };
    const t = mod.run(data, mod.defaultParams);
    const { container } = wrap(<mod.Scene trace={t} index={t.frames.length - 1} data={data} reveal="all" />);
    expect(container.querySelectorAll("[data-part=letter]")).toHaveLength(40);
    for (const el of container.querySelectorAll("*")) for (const a of el.attributes) expect(a.value).not.toMatch(/NaN|Infinity/);
  });

  it("controls: typing text and the memory slider", async () => {
    const onData = vi.fn();
    const onParams = vi.fn();
    wrap(<mod.LabControls params={mod.defaultParams} data={mod.defaultData} onParams={onParams} onData={onData} labels={labels} />);
    // The box is controlled by the workspace; set its value in one go.
    fireEvent.change(screen.getByLabelText(/Your string/), { target: { value: "B c d" } });
    expect(onData).toHaveBeenLastCalledWith({ presetId: "custom", text: "bcd" });
    expect(screen.getByLabelText(/Memory strength/)).toHaveValue("1");
    await userEvent.click(screen.getByRole("button", { name: "Long" }));
    expect(onData.mock.calls.at(-1)![0].presetId).toBe("long");
  });

  it("every code line used exists in both tabs", () => {
    for (const f of mod.run(mod.defaultData, mod.defaultParams).frames) {
      expect(keys(mod.code.python)).toContain(f.codeLine);
      expect(keys(mod.code.pseudo)).toContain(f.codeLine);
    }
  });
});
