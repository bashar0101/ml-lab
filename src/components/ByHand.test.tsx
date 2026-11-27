import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ui from "../../content/en/ui.json";
import lrJson from "../../content/en/lessons/linear-regression.json";
import knnJson from "../../content/en/lessons/k-nearest-neighbors.json";
import { LessonContentSchema } from "@/content/schema";
import { UiProvider } from "@/i18n/ui-context";
import { byHandFor } from "@/lessons/byHand";
import { ByHand } from "./ByHand";

const lr = LessonContentSchema.parse(lrJson).byHand!;
const knn = LessonContentSchema.parse(knnJson).byHand!;
/** Text without the invisible direction marks that keep numbers readable in Arabic. */
const plain = (s: string | null) => (s ?? "").replace(/[\u2066-\u2069]/g, "");

function show(slug: string, text: typeof lr) {
  return render(
    <UiProvider strings={ui}>
      <ByHand example={byHandFor(slug)!} text={text} />
    </UiProvider>,
  );
}

describe("ByHand", () => {
  it("states the problem with the given data, and hides the solution at first", () => {
    show("linear-regression", lr);
    expect(screen.getByRole("heading", { name: "Solve it by hand" })).toBeTruthy();
    expect(plain(screen.getByTestId("problem").textContent)).toContain("a car that is 4 years old");
    expect(screen.getByRole("table")).toBeTruthy();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
    expect(screen.getByRole("button", { name: "Show step 1" })).toBeTruthy();
  });

  it("reveals one step at a time, with its formulas and table, then the answer", () => {
    show("linear-regression", lr);
    fireEvent.click(screen.getByRole("button", { name: "Show step 1" }));
    const first = screen.getAllByRole("listitem")[0];
    expect(within(first).getByRole("heading").textContent).toContain("Find the averages");
    expect(plain(first.textContent)).toContain("= (1 + 3 + 5 + 7) / 4 = 16 / 4 = 4");
    expect(screen.queryByTestId("answer")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Show step 2" }));
    const table = within(screen.getAllByRole("listitem")[1]).getByRole("table");
    expect(plain(table.textContent)).toContain("−1440");

    fireEvent.click(screen.getByRole("button", { name: "Show all steps" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(plain(screen.getByTestId("answer").textContent)).toContain("ŷ = −72x + 968");
    expect(screen.queryByRole("button", { name: /Show step/ })).toBeNull();
  });

  it("draws the mean bar itself, so x̄ never depends on the font", () => {
    show("linear-regression", lr);
    fireEvent.click(screen.getByRole("button", { name: "Show all steps" }));
    const bars = [...document.querySelectorAll("[data-bar]")].map((b) => b.textContent);
    expect(bars).toContain("x");
    expect(bars).toContain("y");
    // In formulas, tables and sentences alike: no combining macron or precomposed ȳ is left.
    expect(document.body.textContent).not.toMatch(/[\u0304\u0233]/);
  });

  it("moves focus to the step it just revealed", () => {
    show("linear-regression", lr);
    fireEvent.click(screen.getByRole("button", { name: "Show step 1" }));
    expect(document.activeElement?.textContent).toContain("Find the averages");
  });

  it("starts over", () => {
    show("linear-regression", lr);
    fireEvent.click(screen.getByRole("button", { name: "Show all steps" }));
    fireEvent.click(screen.getByRole("button", { name: "Start over" }));
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("fills words into tables and marks the chosen rows", () => {
    show("k-nearest-neighbors", knn);
    expect(screen.getAllByText("good").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Show all steps" }));
    const nearest = within(screen.getAllByRole("listitem")[2]).getByRole("table");
    expect(nearest.querySelectorAll("tbody tr[data-mark]")).toHaveLength(3);
    expect(plain(screen.getByTestId("answer").textContent)).toContain("classified as good");
  });
});
