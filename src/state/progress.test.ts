import { describe, expect, it } from "vitest";
import { createProgressStore, PROGRESS_KEY } from "./progress";

function memoryStorage(init: Record<string, string> = {}): Storage {
  const m = new Map(Object.entries(init));
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
    key: (i: number) => [...m.keys()][i] ?? null,
    get length() {
      return m.size;
    },
  };
}

describe("progress store", () => {
  it("survives a throwing storage", () => {
    const bad = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    } as unknown as Storage;
    const p = createProgressStore(bad);
    expect(p.get("linear-regression")).toEqual({ lastStep: 0, completed: false });
    expect(() => p.complete("linear-regression")).not.toThrow();
    expect(() => p.reachStep("linear-regression", 2)).not.toThrow();
  });

  it("works with no storage at all", () => {
    const p = createProgressStore(null);
    p.complete("a");
    expect(p.get("a").completed).toBe(true);
    expect(p.completedCount()).toBe(1);
  });

  it("ignores corrupt JSON and keeps the max step", () => {
    const s = memoryStorage({ [PROGRESS_KEY]: "{not json" });
    const p = createProgressStore(s);
    p.reachStep("linear-regression", 4);
    p.reachStep("linear-regression", 2);
    expect(p.get("linear-regression").lastStep).toBe(4);
  });

  it("persists across stores and counts completed lessons", () => {
    const s = memoryStorage();
    const a = createProgressStore(s);
    a.complete("linear-regression");
    a.reachStep("pca", 1);
    const b = createProgressStore(s);
    expect(b.get("linear-regression").completed).toBe(true);
    expect(b.completedCount()).toBe(1);
    expect(JSON.parse(s.getItem(PROGRESS_KEY)!)["linear-regression"].completed).toBe(true);
  });

  it("ignores well-formed JSON of the wrong shape", () => {
    const p = createProgressStore(memoryStorage({ [PROGRESS_KEY]: '{"x": 5, "y": {"lastStep": "a"}}' }));
    expect(p.get("x")).toEqual({ lastStep: 0, completed: false });
    expect(p.completedCount()).toBe(0);
  });
});
