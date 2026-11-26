import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import ui from "../../../content/en/ui.json";
import { UiProvider } from "@/i18n/ui-context";
import { ClassDataControls, type ClassData } from "./ClassDataControls";
import { makeDataset } from "./datasets2d";

const wrap = (node: ReactNode) => render(<UiProvider strings={ui}>{node}</UiProvider>);
const labels = { blobs: "Two groups", circles: "Rings" };

describe("ClassDataControls", () => {
  it("picks a preset", async () => {
    const onData = vi.fn();
    const data: ClassData = { presetId: "blobs", points: makeDataset("blobs"), drawClass: 0 };
    wrap(<ClassDataControls data={data} onData={onData} presets={["blobs", "circles"]} labels={labels} classes={2} />);
    expect(screen.getByRole("button", { name: "Two groups" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: "Rings" }));
    expect(onData).toHaveBeenLastCalledWith({ presetId: "circles", points: makeDataset("circles"), drawClass: 0 });
  });

  it("draw mode: choose a class, type a point, remove a point", async () => {
    const onData = vi.fn();
    const data: ClassData = { presetId: "custom", points: [{ x: 1, y: 2, c: 0 }], drawClass: 0 };
    wrap(<ClassDataControls data={data} onData={onData} presets={["blobs"]} labels={labels} classes={2} />);
    await userEvent.click(screen.getByRole("button", { name: "Class B" }));
    expect(onData).toHaveBeenLastCalledWith({ ...data, drawClass: 1 });
    await userEvent.type(screen.getByLabelText("x"), "3");
    await userEvent.type(screen.getByLabelText("y"), "4");
    await userEvent.click(screen.getByRole("button", { name: "Add point" }));
    expect(onData).toHaveBeenLastCalledWith({ ...data, points: [{ x: 1, y: 2, c: 0 }, { x: 3, y: 4, c: 0 }] });
    await userEvent.click(screen.getByRole("button", { name: "Remove point (1, 2)" }));
    expect(onData).toHaveBeenLastCalledWith({ ...data, points: [] });
  });

  it("starting to draw keeps nothing and asks for the first class", async () => {
    const onData = vi.fn();
    const data: ClassData = { presetId: "blobs", points: makeDataset("blobs"), drawClass: 1 };
    wrap(<ClassDataControls data={data} onData={onData} presets={["blobs"]} labels={labels} classes={3} />);
    await userEvent.click(screen.getByRole("button", { name: "Draw your own" }));
    expect(onData).toHaveBeenLastCalledWith({ presetId: "custom", points: [], drawClass: 0 });
  });
});

describe("typed points", () => {
  it("are kept inside the 0–10 chart", async () => {
    const onData = vi.fn();
    const data: ClassData = { presetId: "custom", points: [], drawClass: 1 };
    wrap(<ClassDataControls data={data} onData={onData} presets={["blobs"]} labels={labels} classes={2} />);
    await userEvent.type(screen.getByLabelText("x"), "15");
    await userEvent.type(screen.getByLabelText("y"), "-2");
    await userEvent.click(screen.getByRole("button", { name: "Add point" }));
    expect(onData).toHaveBeenLastCalledWith({ ...data, points: [{ x: 10, y: 0, c: 1 }] });
  });
});
