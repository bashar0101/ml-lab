import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import ui from "../../content/en/ui.json";
import { LessonContentSchema } from "@/content/schema";
import { LessonArticle } from "./LessonArticle";

const load = (slug: string) =>
  LessonContentSchema.parse(JSON.parse(readFileSync(path.join(process.cwd(), "content/en/lessons", `${slug}.json`), "utf8")));

describe("LessonArticle keep learning", () => {
  it("a coming-soon next lesson is named, and the next lesson you can open today is linked", () => {
    render(<LessonArticle slug="gradient-descent" content={load("gradient-descent")} ui={ui} />);
    expect(screen.getByText(/Feature Scaling/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Feature Scaling/ })).toBeNull();
    expect(screen.getByRole("link", { name: /Logistic Regression/ })).toHaveAttribute("href", expect.stringMatching(/^\/lessons\/logistic-regression\/?$/));
  });

  it("a live next lesson is a single link", () => {
    render(<LessonArticle slug="linear-regression" content={load("linear-regression")} ui={ui} />);
    expect(screen.getByRole("link", { name: /Gradient Descent/ })).toHaveAttribute("href", expect.stringMatching(/^\/lessons\/gradient-descent\/?$/));
    expect(screen.queryByText(ui["article.nextAvailable"])).toBeNull();
  });
});
