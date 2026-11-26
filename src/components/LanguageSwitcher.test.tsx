import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ui from "../../content/en/ui.json";
import { UiProvider } from "@/i18n/ui-context";
import { LanguageSwitcher } from "./LanguageSwitcher";

vi.mock("next/navigation", () => ({ usePathname: () => "/ar/lessons/pca/" }));

describe("LanguageSwitcher", () => {
  it("links to the same page in every language, each named in its own language", async () => {
    render(
      <UiProvider strings={ui}>
        <LanguageSwitcher />
      </UiProvider>,
    );
    await userEvent.click(screen.getByText("AR"));
    expect(screen.getByRole("link", { name: "English" })).toHaveAttribute("href", "/lessons/pca/");
    expect(screen.getByRole("link", { name: "Türkçe" })).toHaveAttribute("href", "/tr/lessons/pca/");
    const ar = screen.getByRole("link", { name: "العربية" });
    expect(ar).toHaveAttribute("aria-current", "true");
    expect(ar).toHaveAttribute("lang", "ar");
    expect(ar).toHaveAttribute("hreflang", "ar");
  });
});
