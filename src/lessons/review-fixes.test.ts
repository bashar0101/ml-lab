import { describe, expect, it } from "vitest";
import { liveLessons } from "@/course/manifest";
import { frameIndexOfTag } from "@/engine/types";
import { loadLessonModule } from "./registry";
import { makeDataset } from "./shared/datasets2d";

describe.each(liveLessons().map((l) => l.slug))("%s stat chips", (slug) => {
  it("never say 'too big' (null) for a value that simply doesn't exist yet", async () => {
    const mod = await loadLessonModule(slug);
    const t = mod.run(mod.defaultData, mod.defaultParams);
    for (const f of t.frames) {
      if (f.event === "diverged") continue;
      for (const chip of mod.stats(f, mod.defaultParams)) expect(chip.value, `${f.event} ${chip.labelKey}`).not.toBeNull();
    }
  });
});

describe("review fixes for lessons 6–9", () => {
  it("random forest: the first sample frame is about tree 1", async () => {
    const mod = await loadLessonModule("random-forest");
    const t = mod.run(mod.defaultData, mod.defaultParams);
    expect(t.frames.find((f) => f.event === "sample")!.metrics.tree).toBe(1);
  });

  it("decision tree: the Python panel shows both stopping settings and the no-useful-question leaf", async () => {
    const mod = await loadLessonModule("decision-tree");
    const py = mod.code.python.map((l) => l.text).join("\n");
    expect(py).toMatch(/max_depth/);
    expect(py).toMatch(/min_leaf/);
    expect(py).toMatch(/gain <= 0/);
    expect(mod.code.python.find((l) => l.key === "return")!.text.trim()).not.toBe("");
  });

  it("k-means: points of different clusters have different shapes, not only colours", async () => {
    const { createElement } = await import("react");
    const { render } = await import("@testing-library/react");
    const mod = await loadLessonModule("k-means");
    const t = mod.run(mod.defaultData, mod.defaultParams);
    const { container } = render(createElement(mod.Scene, { trace: t, index: t.frames.length - 1, data: mod.defaultData, reveal: "all" }));
    const shapes = new Map<string, string>();
    container.querySelectorAll("[data-part=point][data-cluster]").forEach((el) => shapes.set(el.getAttribute("data-cluster")!, el.tagName));
    expect(new Set(shapes.values()).size).toBe(shapes.size);
  });

  it("k-means: the Python panel mentions the k-means++ start the Lab offers", async () => {
    const mod = await loadLessonModule("k-means");
    expect(mod.code.python.map((l) => l.text).join("\n")).toMatch(/k-means\+\+/);
  });

  it("k-means: moons with k = 2 misplace at least a fifth of the points (break-it says 'a quarter or more' for the default)", async () => {
    const mod = await loadLessonModule("k-means");
    const moons = makeDataset("moons");
    const a = mod.run({ presetId: "moons", points: moons, drawClass: 0 }, { ...mod.defaultParams, k: 2 }).frames.at(-1)!.state as { assign: number[] };
    const agree = moons.filter((p, i) => p.c === a.assign[i]).length / moons.length;
    expect(1 - Math.max(agree, 1 - agree)).toBeGreaterThanOrEqual(0.25);
  });

  it("pca: keeping both directions shows a 'keep' frame with its own code line, not a squash", async () => {
    const mod = await loadLessonModule("pca");
    const t = mod.run(mod.defaultData, { components: 2 });
    const i = frameIndexOfTag(t, "project");
    expect(t.frames[i].event).toBe("keep");
    expect(mod.code.python.some((l) => l.key === "keep")).toBe(true);
    expect(mod.code.pseudo.some((l) => l.key === "keep")).toBe(true);
  });
});
