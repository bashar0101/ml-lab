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
const labels = {
  presets: { pronoun: "Pronoun", describe: "Describe", long: "Long" },
  params: { positions: { label: "Add word positions" } },
};
const noBadNumbers = (root: Element) => {
  for (const el of root.querySelectorAll("*")) for (const a of el.attributes) expect(a.value).not.toMatch(/NaN|Infinity/);
};

describe("attention module", () => {
  it("is registered", () => {
    expect(hasLessonModule("attention-transformers")).toBe(true);
  });

  it("one token per word, the inspected word marked; arcs and weights appear at the softmax step", () => {
    const t = mod.run(mod.defaultData, mod.defaultParams);
    const n = mod.defaultData.text.split(" ").length;
    const at = (tag: string) => t.frames.findIndex((f) => f.tags.includes(tag));
    const { container, rerender } = wrap(<mod.Scene trace={t} index={at("scores")} data={mod.defaultData} reveal="all" />);
    expect(container.querySelectorAll("[data-part=token]")).toHaveLength(n);
    expect(container.querySelectorAll("[data-part=token][data-selected=true]")).toHaveLength(1);
    expect(container.querySelectorAll("[data-part=score]")).toHaveLength(n);
    expect(container.querySelectorAll("[data-part=arc]")).toHaveLength(0);
    rerender(rewrap(<mod.Scene trace={t} index={at("softmax")} data={mod.defaultData} reveal="all" />));
    expect(container.querySelectorAll("[data-part=arc]")).toHaveLength(n - 1);
    expect(container.querySelectorAll("[data-part=weight]")).toHaveLength(n);
    expect(container.querySelector("[data-part=output]")).toBeNull();
    expect(container.querySelector("[data-part=cell]")).toBeNull();
    rerender(rewrap(<mod.Scene trace={t} index={at("done")} data={mod.defaultData} reveal="all" />));
    expect(container.querySelector("[data-part=output]")).not.toBeNull();
    expect(container.querySelectorAll("[data-part=cell]")).toHaveLength(2 * n * n);
    noBadNumbers(container);
  });

  it("names the inspected word and warns when positions are off", () => {
    const t = mod.run(mod.defaultData, { ...mod.defaultParams, positions: false });
    const { container } = wrap(<mod.Scene trace={t} index={0} data={mod.defaultData} reveal="all" />);
    expect(container.textContent).toContain("“it”");
    expect(container.textContent).toContain("no positions");
  });

  it("a 12-word sentence still fits without NaN", () => {
    const data = { presetId: "custom", text: "the cat saw a dog and the bird saw it and ran" };
    const t = mod.run(data, mod.defaultParams);
    const { container } = wrap(<mod.Scene trace={t} index={t.frames.length - 1} data={data} reveal="all" />);
    expect(container.querySelectorAll("[data-part=token]")).toHaveLength(12);
    noBadNumbers(container);
  });

  it("controls: presets reset the inspected word; word, head and positions are keyboard buttons", async () => {
    const onData = vi.fn();
    const onParams = vi.fn();
    wrap(<mod.LabControls params={mod.defaultParams} data={mod.defaultData} onParams={onParams} onData={onData} labels={labels} />);
    const words = screen.getByRole("group", { name: /Inspect a word/ });
    expect(words.querySelector("[aria-pressed=true]")!.textContent).toBe("it");
    await userEvent.click(screen.getAllByRole("button", { name: "dog" })[0]);
    expect(onParams).toHaveBeenLastCalledWith({ ...mod.defaultParams, word: 4 });
    await userEvent.click(screen.getByRole("button", { name: /Head 2/ }));
    expect(onParams).toHaveBeenLastCalledWith({ ...mod.defaultParams, head: 1 });
    await userEvent.click(screen.getByLabelText(/Add word positions/));
    expect(onParams).toHaveBeenLastCalledWith({ ...mod.defaultParams, positions: false });
    await userEvent.click(screen.getByRole("button", { name: "Long" }));
    expect(onParams).toHaveBeenLastCalledWith({ ...mod.defaultParams, word: null });
    expect(onData.mock.calls.at(-1)![0].presetId).toBe("long");
    fireEvent.change(screen.getByLabelText(/Your sentence/), { target: { value: "The  DOG ran" } });
    expect(onData).toHaveBeenLastCalledWith({ presetId: "custom", text: "the dog ran" });
  });

  it("controls: an invalid sentence hides the word picker instead of crashing", () => {
    const data = { presetId: "custom", text: "the cow ran" };
    wrap(<mod.LabControls params={mod.defaultParams} data={data} onParams={vi.fn()} onData={vi.fn()} labels={labels} />);
    expect(screen.queryByRole("group", { name: /Inspect a word/ })).toBeNull();
  });

  it("word, head and positions edits keep the playback frame", () => {
    expect(mod.viewOnly?.(mod.defaultParams, { ...mod.defaultParams, word: 2 })).toBe(true);
    expect(mod.viewOnly?.(mod.defaultParams, { ...mod.defaultParams, positions: false })).toBe(true);
  });

  it("every code line used exists in both tabs", () => {
    for (const f of mod.run(mod.defaultData, mod.defaultParams).frames) {
      expect(keys(mod.code.python)).toContain(f.codeLine);
      expect(keys(mod.code.pseudo)).toContain(f.codeLine);
    }
  });
});
