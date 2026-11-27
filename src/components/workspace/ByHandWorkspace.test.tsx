import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import ui from "../../../content/en/ui.json";
import lrJson from "../../../content/en/lessons/linear-regression.json";
import lgJson from "../../../content/en/lessons/logistic-regression.json";
import { LessonContentSchema } from "@/content/schema";
import { UiProvider } from "@/i18n/ui-context";
import { TOUR_DONE_KEY } from "@/components/tour/steps";
import { LessonWorkspace } from "./LessonWorkspace";

const lr = LessonContentSchema.parse(lrJson);
const lg = LessonContentSchema.parse(lgJson);
const open = (slug: string, content: typeof lr) =>
  render(
    <UiProvider strings={ui}>
      <LessonWorkspace slug={slug} content={content} />
    </UiProvider>,
  );
const paperButton = () => screen.findByRole("button", { name: ui["lab.byHand"] });
const carPrices = () => screen.getByRole("button", { name: lr.lab.presets["car-prices"] });

afterEach(() => {
  window.location.hash = "";
  localStorage.setItem(TOUR_DONE_KEY, "1");
});

describe("opening the Lab on the paper example", () => {
  it("a #lab-by-hand link opens the Lab with the paper's data and settings", async () => {
    localStorage.setItem(TOUR_DONE_KEY, "1");
    window.location.hash = "#lab-by-hand";
    open("linear-regression", lr);
    expect((await paperButton()).getAttribute("aria-pressed")).toBe("true");
    expect(carPrices().getAttribute("aria-pressed")).toBe("true");
  });

  it("the link works while the page is open, from Learn mode", async () => {
    localStorage.setItem(TOUR_DONE_KEY, "1");
    open("linear-regression", lr);
    await screen.findByText("Step 1 / 6");
    await act(async () => {
      window.location.hash = "#lab-by-hand";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect((await paperButton()).getAttribute("aria-pressed")).toBe("true");
    expect(carPrices().getAttribute("aria-pressed")).toBe("true");
  });

  it("the Lab's Paper example button loads it, and editing the data leaves it", async () => {
    localStorage.setItem(TOUR_DONE_KEY, "1");
    window.location.hash = "#lab";
    open("linear-regression", lr);
    const button = await paperButton();
    expect(button.getAttribute("aria-pressed")).toBe("false");
    await userEvent.click(button);
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(window.location.hash).toBe("#lab-by-hand");
    await userEvent.click(screen.getByRole("button", { name: lr.lab.presets["study-hours"] }));
    expect(button.getAttribute("aria-pressed")).toBe("false");
    expect(window.location.hash).toBe("#lab");
  });

  it("lessons whose Lab cannot reproduce the paper have no such button", async () => {
    localStorage.setItem(TOUR_DONE_KEY, "1");
    window.location.hash = "#lab";
    open("logistic-regression", lg);
    await screen.findByRole("heading", { name: ui["lab.yourData"] });
    expect(screen.queryByRole("button", { name: ui["lab.byHand"] })).toBeNull();
  });
});
