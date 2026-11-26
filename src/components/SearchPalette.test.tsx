import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ui from "../../content/en/ui.json";
import { UiProvider } from "@/i18n/ui-context";
import type { SearchEntry } from "@/search";
import { SearchPalette } from "./SearchPalette";

const ENTRIES: SearchEntry[] = [
  { href: "/lessons/backpropagation/", title: "Backpropagation", lesson: "Backpropagation", kind: "lesson", text: "how blame flows backwards" },
  { href: "/lessons/backpropagation/#step-2", title: "The chain rule", lesson: "Backpropagation", kind: "step", text: "blame multiplies" },
  { href: "/lessons/linear-regression/", title: "Linear Regression", lesson: "Linear Regression", kind: "lesson", text: "fit a line" },
];

function setup() {
  const load = vi.fn(async () => ENTRIES);
  const navigate = vi.fn();
  render(
    <UiProvider strings={ui}>
      <SearchPalette loadIndex={load} navigate={navigate} />
      <input aria-label="elsewhere" />
    </UiProvider>,
  );
  return { load, navigate };
}

describe("SearchPalette", () => {
  it("Ctrl K opens it, loads the index once, and Enter opens the highlighted result", async () => {
    const { load, navigate } = setup();
    await userEvent.keyboard("{Control>}k{/Control}");
    const box = await screen.findByRole("combobox");
    expect(box).toHaveFocus();
    await userEvent.type(box, "blame");
    const options = await screen.findAllByRole("option");
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getAllByRole("option")[1]).toHaveAttribute("aria-selected", "true");
    expect(box).toHaveAttribute("aria-activedescendant", screen.getAllByRole("option")[1].id);
    await userEvent.keyboard("{Enter}");
    expect(navigate).toHaveBeenCalledWith("/lessons/backpropagation/#step-2");
    expect(screen.queryByRole("dialog")).toBeNull();
    await userEvent.keyboard("{Control>}k{/Control}");
    await screen.findByRole("combobox");
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("the button opens it; Escape closes it and gives focus back", async () => {
    setup();
    const button = screen.getByRole("button", { name: /Search lessons and ideas/ });
    await userEvent.click(button);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(button).toHaveFocus();
  });

  it("'/' opens it, but not while typing somewhere else", async () => {
    setup();
    await userEvent.click(screen.getByLabelText("elsewhere"));
    await userEvent.keyboard("/");
    expect(screen.queryByRole("dialog")).toBeNull();
    act(() => (document.activeElement as HTMLElement).blur());
    await userEvent.keyboard("/");
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveValue("");
  });

  it("says so when nothing matches, and the arrow keys stay put", async () => {
    setup();
    await userEvent.keyboard("{Control>}k{/Control}");
    await userEvent.type(await screen.findByRole("combobox"), "zzzz");
    expect(await screen.findByText(ui["search.empty"])).toBeInTheDocument();
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("results are real links, so they can be opened in a new tab", async () => {
    setup();
    await userEvent.keyboard("{Control>}k{/Control}");
    await userEvent.type(await screen.findByRole("combobox"), "linear");
    const link = (await screen.findAllByRole("option"))[0].querySelector("a")!;
    expect(link).toHaveAttribute("href", "/lessons/linear-regression/");
  });
});
