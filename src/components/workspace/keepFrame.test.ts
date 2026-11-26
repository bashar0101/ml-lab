import { describe, expect, it } from "vitest";
import { keepsFrame } from "./keepFrame";

const ok = { params: { a: 1 }, error: null };
const viewOnly = (_p: unknown, n: unknown) => (n as { a: number }).a !== 99;

describe("keepsFrame", () => {
  it("param edits keep the frame only when the module says they are view-only", () => {
    expect(keepsFrame({ viewOnly }, ok, { params: { a: 2 } })).toBe(true);
    expect(keepsFrame({ viewOnly }, ok, { params: { a: 99 } })).toBe(false);
    expect(keepsFrame({}, ok, { params: { a: 2 } })).toBe(false);
  });

  it("data edits restart unless the module keeps its frame on data", () => {
    expect(keepsFrame({ viewOnly }, ok, { data: {} })).toBe(false);
    expect(keepsFrame({ keepFrameOnData: true }, ok, { data: {} })).toBe(true);
    expect(keepsFrame({ keepFrameOnData: true, viewOnly }, ok, { data: {}, params: { a: 99 } })).toBe(false);
  });

  it("never keeps a frame from an invalid or missing run", () => {
    expect(keepsFrame({ keepFrameOnData: true, viewOnly }, { ...ok, error: "bad" }, { data: {} })).toBe(false);
    expect(keepsFrame({ keepFrameOnData: true, viewOnly }, null, { params: { a: 2 } })).toBe(false);
  });
});
