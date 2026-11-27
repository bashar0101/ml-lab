import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ui from "../../../content/en/ui.json";
import { UiProvider } from "@/i18n/ui-context";
import { LESSON_TOUR } from "./steps";
import { Tour } from "./Tour";

function setup() {
  const onClose = vi.fn();
  const onEnterStep = vi.fn();
  render(
    <UiProvider strings={ui}>
      <div data-tour="story">story card</div>
      <div data-tour="rail">rail</div>
      <Tour steps={LESSON_TOUR} onClose={onClose} onEnterStep={onEnterStep} />
    </UiProvider>,
  );
  return { onClose, onEnterStep };
}

describe("Tour", () => {
  it("is a labelled dialog that starts at the story card", () => {
    const { onEnterStep } = setup();
    const dialog = screen.getByRole("dialog", { name: ui["tour.story.title"] });
    expect(dialog).toHaveTextContent(ui["tour.story.body"]);
    expect(dialog).toHaveTextContent(`1 / ${LESSON_TOUR.length}`);
    expect(onEnterStep).toHaveBeenLastCalledWith(LESSON_TOUR[0]);
    expect(screen.getByRole("button", { name: ui["tour.next"] })).toHaveFocus();
    expect(screen.queryByRole("button", { name: ui["tour.back"] })).toBeNull();
  });

  it("Next and Back walk the steps and tell the page which step is showing", async () => {
    const { onEnterStep } = setup();
    await userEvent.click(screen.getByRole("button", { name: ui["tour.next"] }));
    expect(screen.getByRole("dialog", { name: ui["tour.rail.title"] })).toBeInTheDocument();
    expect(onEnterStep).toHaveBeenLastCalledWith(LESSON_TOUR[1]);
    await userEvent.click(screen.getByRole("button", { name: ui["tour.back"] }));
    expect(screen.getByRole("dialog", { name: ui["tour.story.title"] })).toBeInTheDocument();
  });

  it("arrow keys move, Escape skips, and the lesson's own keys don't see them", () => {
    const { onClose } = setup();
    const lessonKeys = vi.fn();
    window.addEventListener("keydown", lessonKeys);
    fireEvent.keyDown(document.activeElement!, { key: "ArrowRight" });
    expect(screen.getByRole("dialog", { name: ui["tour.rail.title"] })).toBeInTheDocument();
    fireEvent.keyDown(document.activeElement!, { key: "ArrowLeft" });
    expect(screen.getByRole("dialog", { name: ui["tour.story.title"] })).toBeInTheDocument();
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    expect(onClose).toHaveBeenCalledWith(false);
    expect(lessonKeys).not.toHaveBeenCalled();
    window.removeEventListener("keydown", lessonKeys);
  });

  it("Skip closes without finishing; Done on the last step finishes", async () => {
    const { onClose } = setup();
    await userEvent.click(screen.getByRole("button", { name: ui["tour.skip"] }));
    expect(onClose).toHaveBeenLastCalledWith(false);
  });

  it("the last step says Done and finishes the tour", async () => {
    const { onClose } = setup();
    for (let i = 1; i < LESSON_TOUR.length; i++) await userEvent.click(screen.getByRole("button", { name: ui["tour.next"] }));
    expect(screen.getByRole("dialog")).toHaveTextContent(`${LESSON_TOUR.length} / ${LESSON_TOUR.length}`);
    await userEvent.click(screen.getByRole("button", { name: ui["tour.done"] }));
    expect(onClose).toHaveBeenLastCalledWith(true);
  });

  it("every step has a title and text in all three languages", async () => {
    for (const lang of ["en", "ar", "tr"]) {
      const strings = (await import(`../../../content/${lang}/ui.json`)).default as Record<string, string>;
      for (const s of LESSON_TOUR) {
        expect(strings[`tour.${s.id}.title`], `${lang} ${s.id}`).toBeTruthy();
        expect(strings[`tour.${s.id}.body`], `${lang} ${s.id}`).toBeTruthy();
      }
    }
  });
});
