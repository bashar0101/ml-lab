import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LessonContentSchema } from "@/content/schema";
import { liveLessons } from "@/course/manifest";
import { buildSearchIndex, searchEntries, type SearchEntry } from "./index";

const load = (slug: string) =>
  LessonContentSchema.parse(JSON.parse(readFileSync(path.join(process.cwd(), "content/en/lessons", `${slug}.json`), "utf8")));
const items = liveLessons().map((l) => ({ slug: l.slug, content: load(l.slug) }));
const index = buildSearchIndex(items);

describe("buildSearchIndex", () => {
  it("one lesson entry, one per story step, article section and FAQ for every live lesson", () => {
    for (const { slug, content } of items) {
      const mine = index.filter((e) => e.href.startsWith(`/lessons/${slug}/`));
      expect(mine.filter((e) => e.kind === "lesson")).toHaveLength(1);
      expect(mine.filter((e) => e.kind === "step")).toHaveLength(content.story.length);
      expect(mine.filter((e) => e.kind === "topic")).toHaveLength(content.article.sections.length);
      expect(mine.filter((e) => e.kind === "faq")).toHaveLength(content.article.faq.length);
      for (const e of mine) expect(e.lesson).toBe(content.title);
    }
  });

  it("story steps link to #step-N (1-based), everything else to the lesson page", () => {
    const steps = index.filter((e) => e.kind === "step" && e.href.startsWith("/lessons/linear-regression/"));
    expect(steps.map((s) => s.href)).toEqual(steps.map((_, k) => `/lessons/linear-regression/#step-${k + 1}`));
    expect(index.find((e) => e.kind === "lesson" && e.lesson === "Linear Regression")!.href).toBe("/lessons/linear-regression/");
  });

  it("strips markdown marks from the text", () => {
    for (const e of index) {
      expect(e.text).not.toMatch(/\*\*|`/);
      expect(e.title).not.toMatch(/\*\*|`/);
    }
  });
});

describe("searchEntries", () => {
  it("a lesson-title match comes first", () => {
    expect(searchEntries(index, "attention")[0]).toMatchObject({ kind: "lesson", lesson: "Attention & Transformers" });
    expect(searchEntries(index, "backprop")[0]).toMatchObject({ kind: "lesson", lesson: "Backpropagation" });
  });

  it("a lesson that mentions the word beats a step or FAQ that only mentions it", () => {
    expect(searchEntries(index, "softmax")[0]).toMatchObject({ kind: "lesson", lesson: "Attention & Transformers" });
  });

  it("every word must match, in any order and any case", () => {
    const hits = searchEntries(index, "SOFTMAX weights");
    expect(hits.length).toBeGreaterThan(0);
    for (const h of hits) {
      const all = `${h.title} ${h.lesson} ${h.text}`.toLowerCase();
      expect(all).toContain("softmax");
      expect(all).toContain("weights");
    }
  });

  it("returns nothing for a blank query or no match, and respects the limit", () => {
    expect(searchEntries(index, "   ")).toEqual([]);
    expect(searchEntries(index, "zzzqqq")).toEqual([]);
    expect(searchEntries(index, "the", 5)).toHaveLength(5);
  });

  it("ties keep index order", () => {
    const tiny: SearchEntry[] = [
      { href: "/a/", title: "x", lesson: "A", kind: "faq", text: "loss" },
      { href: "/b/", title: "y", lesson: "B", kind: "faq", text: "loss" },
    ];
    expect(searchEntries(tiny, "loss").map((e) => e.href)).toEqual(["/a/", "/b/"]);
  });
});
