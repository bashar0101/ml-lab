import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import ui from "../../../content/en/ui.json";
import { UiProvider } from "@/i18n/ui-context";
import { CourseTree } from "./CourseTree";

const renderTree = (slug = "k-nearest-neighbors") =>
  render(
    <UiProvider strings={ui}>
      <CourseTree currentSlug={slug} completed={new Set()} />
    </UiProvider>,
  );
const chapterButton = (name: RegExp) => screen.getByRole("button", { name });

describe("CourseTree accordion", () => {
  it("opens only the chapter of the current lesson", () => {
    renderTree();
    expect(chapterButton(/Classification/)).toHaveAttribute("aria-expanded", "true");
    expect(chapterButton(/Foundations/)).toHaveAttribute("aria-expanded", "false");
    const panel = document.getElementById(chapterButton(/Foundations/).getAttribute("aria-controls")!)!;
    expect(panel).toHaveAttribute("inert");
    expect(document.getElementById(chapterButton(/Classification/).getAttribute("aria-controls")!)).not.toHaveAttribute("inert");
    expect(screen.getByRole("link", { name: /k-Nearest Neighbors/ })).toHaveAttribute("aria-current", "page");
  });

  it("chapter headers toggle with a click or the keyboard", async () => {
    renderTree();
    const foundations = chapterButton(/Foundations/);
    await userEvent.click(foundations);
    expect(foundations).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById(foundations.getAttribute("aria-controls")!)).not.toHaveAttribute("inert");
    foundations.focus();
    await userEvent.keyboard("{Enter}");
    expect(foundations).toHaveAttribute("aria-expanded", "false");
  });

  it("the header still shows the chapter's progress", () => {
    renderTree();
    expect(chapterButton(/Classification/)).toHaveTextContent("0/6");
  });
});
