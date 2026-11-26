import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ui from "../../../content/en/ui.json";
import lrJson from "../../../content/en/lessons/linear-regression.json";
import { LessonContentSchema } from "@/content/schema";
import { UiProvider } from "@/i18n/ui-context";
import lrModule from "@/lessons/linear-regression";
import { LessonWorkspace } from "./LessonWorkspace";

const lr = LessonContentSchema.parse(lrJson);

/** Renders the workspace in Lab, waits for the module, then fakes only the player's interval timer. */
async function openLab() {
  window.location.hash = "#lab";
  render(
    <UiProvider strings={ui}>
      <LessonWorkspace slug="linear-regression" content={lr} />
    </UiProvider>,
  );
  await screen.findByText("1 / 122");
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
}

const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

afterEach(() => {
  vi.useRealTimers();
});

describe("LessonWorkspace, Lab mode", () => {
  it("play advances frames and highlights the matching code line", async () => {
    await openLab();
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    advance(120 * 2); // index 0 → 2, the "error" frame of step 1
    expect(screen.getByText("3 / 122")).toBeVisible();
    expect(document.querySelector("[aria-current=true]")!.textContent).toContain("error = guess - y");
    expect(screen.getByRole("button", { name: "Pause" })).toBeVisible();
  });

  it("changing the learning rate while playing stops and resets", async () => {
    await openLab();
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    advance(1200);
    fireEvent.change(screen.getByLabelText(/Learning rate/), { target: { value: "0.5" } });
    advance(1200);
    expect(screen.getByText(/^1 \/ \d+$/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Play" })).toBeVisible();
  });

  it("invalid drawn data shows a message and keeps the old trace", async () => {
    await openLab();
    fireEvent.click(screen.getByRole("button", { name: /Draw your own/ })); // starts empty
    expect(screen.getByText(lr.lab.errors.tooFew)).toBeVisible();
    // the old model is not drawn over the new (empty) data
    expect(document.querySelector("[data-part=line]")).toBeNull();
    expect(screen.getByText(/\/ 122$/)).toBeVisible();
  });

  it("lr 1.2 shows the overshoot explanation on an overshoot frame", async () => {
    await openLab();
    fireEvent.change(screen.getByLabelText(/Learning rate/), { target: { value: "1.2" } });
    const t = lrModule.run(lrModule.defaultData, { ...lrModule.defaultParams, learningRate: 1.2 });
    const i = t.frames.findIndex((f) => f.event === "overshoot");
    fireEvent.change(screen.getByLabelText("Training step"), { target: { value: String(i) } });
    expect(screen.getByText(`Step ${t.frames[i].metrics.iteration}: overshoot!`)).toBeVisible();
  });

  it("the explanation is not announced on every frame while playing", async () => {
    await openLab();
    const live = () => screen.getByText("Current step").closest("[aria-live]")!;
    expect(live()).toHaveAttribute("aria-live", "polite");
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(live()).toHaveAttribute("aria-live", "off");
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(live()).toHaveAttribute("aria-live", "polite");
  });

  it("invalid data stops playback, and the step chip keeps the run's own step count", async () => {
    await openLab();
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    advance(240);
    expect(screen.getByText("3 / 122")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /Draw your own/ }));
    advance(1200);
    expect(screen.getByText("3 / 122")).toBeVisible();
    fireEvent.change(screen.getByLabelText(/^Steps/), { target: { value: "100" } });
    // The course menu's progress ("0 / 40 lessons") also matches; look only outside it.
    const chips = screen.getAllByText(/\/ 40/).filter((el) => !el.closest("nav"));
    expect(chips).toHaveLength(1);
    expect(chips[0]).toBeVisible();
    expect(screen.queryByText(/\/ 100/)).toBeNull();
  });

  it("switches the code tab to pseudocode", async () => {
    await openLab();
    fireEvent.click(screen.getByRole("button", { name: "Pseudocode" }));
    expect(screen.getByText(/nudge w and b a little downhill/)).toBeVisible();
  });

  it("keyboard: arrows step frames in Lab, L returns to Learn", async () => {
    await openLab();
    fireEvent.keyDown(document.body, { key: "ArrowRight" });
    fireEvent.keyDown(document.body, { key: "ArrowRight" });
    expect(screen.getByText("3 / 122")).toBeVisible();
    fireEvent.keyDown(document.body, { key: "l" });
    expect(screen.getByRole("button", { name: "Learn", pressed: true })).toBeInTheDocument();
    expect(screen.getByText("Step 1 / 6")).toBeVisible();
  });

  it("speed chips change the playback speed", async () => {
    await openLab();
    fireEvent.click(screen.getByRole("button", { name: "4×" }));
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    advance(30 * 4);
    expect(screen.getByText("5 / 122")).toBeVisible();
  });
});
