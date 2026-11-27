import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ui from "../../../content/en/ui.json";
import { UiProvider } from "@/i18n/ui-context";
import { ZoomStage } from "./ZoomStage";

const renderStage = (enabled = true) =>
  render(
    <UiProvider strings={ui}>
      <ZoomStage enabled={enabled} header={<div>chips</div>}>
        <svg data-testid="scene" viewBox="0 0 780 400" />
      </ZoomStage>
    </UiProvider>,
  );
const stage = () => document.querySelector("[data-zoom]") as HTMLElement;

afterEach(() => {
  Reflect.deleteProperty(HTMLElement.prototype, "requestFullscreen");
});

describe("ZoomStage", () => {
  it("only the Lab gets the view toolbar", () => {
    renderStage(false);
    expect(screen.queryByRole("toolbar")).toBeNull();
    expect(screen.getByTestId("scene")).toBeInTheDocument();
  });

  it("zoom in and out in steps between 100% and 300%; the readout resets", async () => {
    renderStage();
    const zin = screen.getByRole("button", { name: "Zoom in" });
    const zout = screen.getByRole("button", { name: "Zoom out" });
    expect(zout).toBeDisabled();
    expect(stage()).toHaveAttribute("data-zoom", "1");
    await userEvent.click(zin);
    await userEvent.click(zin);
    expect(stage()).toHaveAttribute("data-zoom", "1.5");
    expect(screen.getByRole("button", { name: /Reset zoom/ })).toHaveTextContent("150%");
    for (let i = 0; i < 10; i++) await userEvent.click(zin);
    expect(stage()).toHaveAttribute("data-zoom", "3");
    expect(zin).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: /Reset zoom/ }));
    expect(stage()).toHaveAttribute("data-zoom", "1");
  });

  it("Ctrl + wheel zooms the picture, a plain wheel scrolls it", () => {
    renderStage();
    const viewport = screen.getByTestId("scene").closest("[data-viewport]")!;
    fireEvent.wheel(viewport, { deltaY: -100 });
    expect(stage()).toHaveAttribute("data-zoom", "1");
    fireEvent.wheel(viewport, { deltaY: -100, ctrlKey: true });
    expect(stage()).toHaveAttribute("data-zoom", "1.25");
    fireEvent.wheel(viewport, { deltaY: 100, ctrlKey: true });
    expect(stage()).toHaveAttribute("data-zoom", "1");
  });

  it("full screen uses the browser API when it exists", async () => {
    const request = vi.fn(async function (this: HTMLElement) {
      Object.defineProperty(document, "fullscreenElement", { configurable: true, get: () => this });
      document.dispatchEvent(new Event("fullscreenchange"));
    });
    Object.defineProperty(HTMLElement.prototype, "requestFullscreen", { configurable: true, value: request });
    renderStage();
    await userEvent.click(screen.getByRole("button", { name: "Full screen" }));
    expect(request).toHaveBeenCalled();
    expect(await screen.findByRole("button", { name: "Exit full screen" })).toBeInTheDocument();
    Object.defineProperty(document, "fullscreenElement", { configurable: true, get: () => null });
  });

  it("without the API it fills the window, and Escape closes it", async () => {
    renderStage();
    await userEvent.click(screen.getByRole("button", { name: "Full screen" }));
    expect(stage()).toHaveAttribute("data-expanded", "true");
    act(() => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    expect(stage()).toHaveAttribute("data-expanded", "false");
  });

  it("leaving the Lab resets the zoom", async () => {
    const { rerender } = renderStage();
    await userEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    rerender(
      <UiProvider strings={ui}>
        <ZoomStage enabled={false} header={<div>chips</div>}>
          <svg data-testid="scene" viewBox="0 0 780 400" />
        </ZoomStage>
      </UiProvider>,
    );
    expect(stage()).toHaveAttribute("data-zoom", "1");
  });
});
