import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import ui from "../../../content/en/ui.json";
import lrJson from "../../../content/en/lessons/linear-regression.json";
import { LessonContentSchema } from "@/content/schema";
import { UiProvider } from "@/i18n/ui-context";
import { LESSON_TOUR, TOUR_DONE_KEY } from "@/components/tour/steps";
import lgJson from "../../../content/en/lessons/logistic-regression.json";
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
    for (let i = 1; i < LESSON_TOUR.length; i++) await next();
    await userEvent.click(screen.getByRole("button", { name: ui["tour.done"] }));
    expect(screen.getByRole("button", { name: "Learn" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Step 1 / 6")).toBeInTheDocument();
  });

  it("shows Solve it by hand, then the Lab's Paper example button, after Break it", async () => {
    renderWorkspace(false);
    await screen.findByText("Step 1 / 6");
    await userEvent.click(screen.getByRole("button", { name: ui["tour.start"] }));
    const next = () => userEvent.click(screen.getByRole("button", { name: ui["tour.next"] }));
    const at = (id: string) => LESSON_TOUR.findIndex((s) => s.id === id);
    for (let i = 0; i < at("byHand"); i++) await next();
    expect(screen.getByRole("dialog", { name: ui["tour.byHand.title"] })).toBeInTheDocument();
    await next();
    expect(screen.getByRole("dialog", { name: ui["tour.paper.title"] })).toBeInTheDocument();
    // The stop lights up the Lab's Paper example button.
    expect(screen.getByRole("button", { name: ui["lab.byHand"] }).closest("[data-tour='paper']")).not.toBeNull();
    expect(screen.getByRole("dialog")).toHaveTextContent(`${at("paper") + 1} / ${LESSON_TOUR.length}`);
  });

  it("skips the Paper example stop on lessons whose Lab cannot show the paper example", async () => {
    const lg = LessonContentSchema.parse(lgJson);
    render(
      <UiProvider strings={ui}>
        <LessonWorkspace slug="logistic-regression" content={lg} />
      </UiProvider>,
    );
    await screen.findByText("Step 1 / 6");
    await userEvent.click(screen.getByRole("button", { name: ui["tour.start"] }));
    expect(screen.getByRole("dialog")).toHaveTextContent(`1 / ${LESSON_TOUR.length - 1}`);
  });
});
