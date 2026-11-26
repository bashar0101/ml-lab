import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import ui from "../../../content/en/ui.json";
import lrJson from "../../../content/en/lessons/linear-regression.json";
import { LessonContentSchema } from "@/content/schema";
import { lessons } from "@/course/manifest";
import { UiProvider } from "@/i18n/ui-context";
import { LessonWorkspace } from "./LessonWorkspace";

const lr = LessonContentSchema.parse(lrJson);

function renderWorkspace() {
  return render(
    <UiProvider strings={ui}>
      <LessonWorkspace slug="linear-regression" content={lr} />
    </UiProvider>,
  );
}

describe("LessonWorkspace, Learn mode", () => {
  it("starts on step 1 and Next walks the story", async () => {
    const user = userEvent.setup();
    renderWorkspace();
    expect(await screen.findByText("Step 1 / 6")).toBeVisible();
    expect(screen.getByRole("heading", { level: 1, name: "Linear Regression" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Next: First guess/ }));
    expect(screen.getByText("Step 2 / 6")).toBeVisible();
    expect(window.location.hash).toBe("#step-2");
  });

  it("Back is disabled on step 1 and returns from step 2", async () => {
    const user = userEvent.setup();
    renderWorkspace();
    const back = await screen.findByRole("button", { name: "Back" });
    expect(back).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /Next:/ }));
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByText("Step 1 / 6")).toBeVisible();
  });

  it("opens at the step in the hash", async () => {
    window.location.hash = "#step-4";
    renderWorkspace();
    expect(await screen.findByText("Step 4 / 6")).toBeVisible();
  });

  it("the step rail jumps to a step", async () => {
    const user = userEvent.setup();
    renderWorkspace();
    await screen.findByText("Step 1 / 6");
    await user.click(screen.getByRole("button", { name: /Measure/ }));
    expect(screen.getByText("Step 3 / 6")).toBeVisible();
  });

  it("the last step's button switches to Lab and marks the lesson complete", async () => {
    const user = userEvent.setup();
    window.location.hash = "#step-6";
    renderWorkspace();
    await user.click(await screen.findByRole("button", { name: /Try it in the lab/ }));
    expect(screen.getByRole("button", { name: "Lab", pressed: true })).toBeInTheDocument();
    expect(window.location.hash).toBe("#lab");
    expect(JSON.parse(localStorage.getItem("mllab:progress")!)["linear-regression"].completed).toBe(true);
  });

  it("coming-soon lessons are not links and the current lesson is", async () => {
    // Every lesson is live now; mark one as coming soon to keep the course tree's behaviour pinned.
    const entry = lessons.find((l) => l.slug === "attention-transformers")!;
    entry.status = "soon";
    try {
      renderWorkspace();
      await screen.findByText("Step 1 / 6");
      const soon = screen.getAllByText("Attention & Transformers")[0];
      expect(soon.closest("a")).toBeNull();
      expect(screen.getAllByRole("link", { name: /Linear Regression/ })[0]).toHaveAttribute("href", expect.stringMatching(/^\/lessons\/linear-regression\/?$/)); // trailing slash comes from next.config at build time
    } finally {
      entry.status = "live";
    }
  });

  it("shows the scene once the lesson module loads", async () => {
    renderWorkspace();
    expect(await screen.findByRole("img", { name: ui["lr.scene.label"] })).toBeInTheDocument();
  });
});
