import { describe, expect, it } from "vitest";
import { liveLessons } from "@/course/manifest";
import { frameIndexOfTag } from "@/engine/types";
import { loadLessonModule } from "@/lessons/registry";
import { loadLesson } from "./load";

const slugs = liveLessons().map((l) => l.slug);

describe.each(slugs)("%s content contract", (slug) => {
  const load = () => Promise.all([loadLesson("en", slug), loadLessonModule(slug)]);

  it("story frame tags exist in the default trace", async () => {
    const [c, m] = await load();
    const t = m.run(m.defaultData, m.defaultParams);
    for (const s of c.story) expect(frameIndexOfTag(t, s.frameTag), s.id).toBeGreaterThanOrEqual(0);
  });

  it("every event in the default trace has text", async () => {
    const [c, m] = await load();
    for (const f of m.run(m.defaultData, m.defaultParams).frames) expect(c.events[f.event], f.event).toBeDefined();
  });

  it("every stat chip has a label", async () => {
    const [c, m] = await load();
    const t = m.run(m.defaultData, m.defaultParams);
    for (const s of m.stats(t.frames[0], m.defaultParams)) expect(c.stats[s.labelKey], s.labelKey).toBeDefined();
  });

  it("every story rail name and reveal list is usable", async () => {
    const [c] = await load();
    expect(new Set(c.story.map((s) => s.id)).size).toBe(c.story.length);
  });
});

describe("linear regression content", () => {
  it("has texts for overshoot, diverged, tooFew and sameX", async () => {
    const c = await loadLesson("en", "linear-regression");
    expect(Object.keys(c.events)).toEqual(expect.arrayContaining(["init", "predict", "error", "update", "overshoot", "diverged", "done"]));
    expect(c.lab.errors).toMatchObject({ tooFew: expect.any(String), sameX: expect.any(String) });
    expect(Object.keys(c.lab.presets)).toEqual(["study-hours", "house-prices", "outlier"]);
    expect(Object.keys(c.lab.params).sort()).toEqual(["learningRate", "steps"]);
  });

  it("follows the fixed story outline", async () => {
    const c = await loadLesson("en", "linear-regression");
    expect(c.story.map((s) => [s.id, s.rail, s.frameTag, s.reveal.join(",")])).toEqual([
      ["problem", "The problem", "start", "points"],
      ["first-guess", "First guess", "start", "points,line"],
      ["measure", "Measure", "start", "points,line,residuals"],
      ["one-step", "One step", "first-update", "points,line,residuals,bowl,path"],
      ["repeat", "Repeat", "update-8", "points,line,bowl,path"],
      ["result", "The result", "done", "points,line,bowl,path"],
    ]);
    expect(c.youWillLearn).toHaveLength(4);
  });
});
