import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import ui from "../../../content/en/ui.json";
import lrJson from "../../../content/en/lessons/linear-regression.json";
import { LessonContentSchema } from "@/content/schema";
import { UiProvider } from "@/i18n/ui-context";
import { TOUR_DONE_KEY } from "@/components/tour/steps";
import { LessonWorkspace } from "./LessonWorkspace";

const lr = LessonContentSchema.parse(lrJson);
const renderWorkspace = (tour: boolean) =>
  render(
    <UiProvider strings={ui}>
      <LessonWorkspace slug="linear-regression" content={lr} tour={tour} />
    </UiProvider>,
  );

describe("guided tour in the lesson", () => {
  it("starts by itself on a first visit to the tour lesson", async () => {
    renderWorkspace(true);
    expect(await screen.findByRole("dialog", { name: ui["tour.story.title"] })).toBeInTheDocument();
  });

  it("does not start again once finished or skipped, and other lessons never auto-start it", async () => {
    localStorage.setItem(TOUR_DONE_KEY, "1");
    renderWorkspace(true);
    await screen.findByText("Step 1 / 6");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("does not interrupt a shared link to a step or the Lab", async () => {
    window.location.hash = "#step-3";
    renderWorkspace(true);
    await screen.findByText("Step 3 / 6");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("the ? button replays it, it opens the Lab for the Lab stops, remembers when skipped and ends back in Learn", async () => {
    renderWorkspace(false);
    await screen.findByText("Step 1 / 6");
    await userEvent.click(screen.getByRole("button", { name: ui["tour.start"] }));
    const next = () => userEvent.click(screen.getByRole("button", { name: ui["tour.next"] }));
    for (let i = 0; i < 4; i++) await next();
    expect(screen.getByRole("dialog", { name: ui["tour.data.title"] })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lab" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: ui["tour.skip"] }));
    expect(localStorage.getItem(TOUR_DONE_KEY)).toBe("1");
    expect(screen.queryByRole("dialog")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: ui["tour.start"] }));
    for (let i = 0; i < 9; i++) await next();
    await userEvent.click(screen.getByRole("button", { name: ui["tour.done"] }));
    expect(screen.getByRole("button", { name: "Learn" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Step 1 / 6")).toBeInTheDocument();
  });
});
