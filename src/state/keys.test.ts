import { fireEvent, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useLessonKeys } from "./keys";

function setup() {
  const h = { next: vi.fn(), prev: vi.fn(), togglePlay: vi.fn(), replay: vi.fn(), toggleMode: vi.fn() };
  renderHook(() => useLessonKeys(h));
  return h;
}

describe("useLessonKeys", () => {
  it("ignores typing in inputs", () => {
    const h = setup();
    const input = document.body.appendChild(document.createElement("input"));
    fireEvent.keyDown(input, { key: "ArrowRight" });
    expect(h.next).not.toHaveBeenCalled();
    fireEvent.keyDown(document.body, { key: "ArrowRight" });
    expect(h.next).toHaveBeenCalledOnce();
    input.remove();
  });

  it("maps arrows, space, r and l", () => {
    const h = setup();
    fireEvent.keyDown(document.body, { key: "ArrowLeft" });
    fireEvent.keyDown(document.body, { key: " " });
    fireEvent.keyDown(document.body, { key: "r" });
    fireEvent.keyDown(document.body, { key: "L" });
    expect(h.prev).toHaveBeenCalledOnce();
    expect(h.togglePlay).toHaveBeenCalledOnce();
    expect(h.replay).toHaveBeenCalledOnce();
    expect(h.toggleMode).toHaveBeenCalledOnce();
  });

  it("ignores keys with modifiers", () => {
    const h = setup();
    fireEvent.keyDown(document.body, { key: "r", ctrlKey: true });
    fireEvent.keyDown(document.body, { key: "ArrowRight", altKey: true });
    expect(h.replay).not.toHaveBeenCalled();
    expect(h.next).not.toHaveBeenCalled();
  });

  it("leaves Space alone on buttons so they still click", () => {
    const h = setup();
    const btn = document.body.appendChild(document.createElement("button"));
    fireEvent.keyDown(btn, { key: " " });
    expect(h.togglePlay).not.toHaveBeenCalled();
    btn.remove();
  });
});
