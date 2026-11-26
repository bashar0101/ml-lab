import { fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ClassMarker, Plot2D } from "./Plot2D";

const box = { x0: 60, y0: 40, x1: 360, y1: 340 };

afterEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (SVGElement.prototype as any).getScreenCTM;
});

describe("Plot2D", () => {
  it("maps data to SVG and clicks back to data through the screen transform", () => {
    // Pretend the SVG is drawn at half size with a 10px offset.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (SVGElement.prototype as any).getScreenCTM = () => ({
      inverse: () => ({ a: 2, b: 0, c: 0, d: 2, e: -20, f: -20 }),
    });
    const onPlotClick = vi.fn();
    let scale: { sx(x: number): number; sy(y: number): number } | null = null;
    const { container } = render(
      <svg viewBox="0 0 780 395">
        <Plot2D box={box} x={[0, 10]} y={[0, 10]} onPlotClick={onPlotClick}>
          {(s) => {
            scale = s;
            return null;
          }}
        </Plot2D>
      </svg>,
    );
    expect(scale!.sx(0)).toBe(60);
    expect(scale!.sx(10)).toBe(360);
    expect(scale!.sy(0)).toBe(340);
    expect(scale!.sy(10)).toBe(40);
    // client (115, 95) → svg (210, 170) → data (5, 5.67)
    fireEvent.click(container.querySelector("[data-part=plot-area]")!, { clientX: 115, clientY: 95 });
    const p = onPlotClick.mock.calls[0][0];
    expect(p.x).toBeCloseTo(5, 6);
    expect(p.y).toBeCloseTo(10 * (340 - 170) / 300, 6);
  });

  it("draws class markers with different shapes per class", () => {
    const { container } = render(
      <svg>
        <ClassMarker x={1} y={1} c={0} />
        <ClassMarker x={2} y={2} c={1} />
        <ClassMarker x={3} y={3} c={2} />
      </svg>,
    );
    const parts = [...container.querySelectorAll("[data-part=point]")];
    expect(parts.map((p) => p.getAttribute("data-class"))).toEqual(["0", "1", "2"]);
    expect(parts.map((p) => p.tagName.toLowerCase())).toEqual(["circle", "rect", "polygon"]);
  });
});
