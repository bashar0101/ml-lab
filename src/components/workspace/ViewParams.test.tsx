import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ui from "../../../content/en/ui.json";
import logJson from "../../../content/en/lessons/logistic-regression.json";
import { LessonContentSchema } from "@/content/schema";
import { UiProvider } from "@/i18n/ui-context";
import { LessonWorkspace } from "./LessonWorkspace";

const content = LessonContentSchema.parse(logJson);

/** Opens the Lab and waits until the run is loaded into the player. */
async function openLab() {
  window.location.hash = "#lab";
  const view = render(
    <UiProvider strings={ui}>
      <LessonWorkspace slug="logistic-regression" content={content} />
    </UiProvider>,
  );
  const scrubber = await screen.findByLabelText("Training step");
  await waitFor(() => expect(Number(scrubber.getAttribute("max"))).toBeGreaterThan(10));
  return { ...view, last: scrubber.getAttribute("max")! };
}

describe("view-only settings", () => {
  it("moving the logistic threshold keeps the current frame and the boundary", async () => {
    const { container, last } = await openLab();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Last" })));
    expect(screen.getByLabelText("Training step")).toHaveValue(last);
    expect(container.querySelector("[data-part=boundary]")).not.toBeNull();
    await act(async () => fireEvent.change(screen.getByLabelText(/Threshold/), { target: { value: "0.8" } }));
    expect(screen.getByLabelText("Training step")).toHaveValue(last);
    expect(container.querySelector("[data-part=boundary]")).not.toBeNull();
  });

  it("changing a real training setting still restarts from the first frame", async () => {
    await openLab();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Last" })));
    await act(async () => fireEvent.change(screen.getByLabelText(/Learning rate/), { target: { value: "1" } }));
    expect(screen.getByLabelText("Training step")).toHaveValue("0");
  });
});
