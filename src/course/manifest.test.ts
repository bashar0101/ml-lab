import { describe, expect, it } from "vitest";
import { chapters, lessonIndex, lessons, lessonsInChapter, liveLessons, nextLesson } from "./manifest";

describe("course manifest", () => {
  it("has 6 chapters and 14 lessons in course order", () => {
    expect(chapters.map((c) => c.id)).toEqual(["foundations", "classification", "trees", "patterns", "neural", "deep"]);
    expect(lessons).toHaveLength(14);
    expect(new Set(lessons.map((l) => l.slug)).size).toBe(14);
    expect(lessons[0].slug).toBe("linear-regression");
  });

  it("only lesson 1 is live", () => {
    expect(liveLessons().map((l) => l.slug)).toEqual(["linear-regression"]);
  });

  it("nextLesson walks course order and ends", () => {
    expect(nextLesson("linear-regression")?.slug).toBe("gradient-descent");
    expect(nextLesson("attention-transformers")).toBeUndefined();
  });

  it("groups lessons by chapter and numbers them from 1", () => {
    expect(lessonsInChapter("classification").map((l) => l.slug)).toEqual([
      "logistic-regression",
      "k-nearest-neighbors",
      "support-vector-machine",
    ]);
    expect(lessonIndex("linear-regression")).toBe(1);
    expect(lessonIndex("attention-transformers")).toBe(14);
  });
});
