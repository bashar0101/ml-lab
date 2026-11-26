import { describe, expect, it } from "vitest";
import { hasLessonModule } from "@/lessons/registry";
import { chapters, lessonIndex, lessons, lessonsInChapter, liveLessons, nextLesson, nextLiveLesson } from "./manifest";

describe("course manifest", () => {
  it("has 8 chapters and 40 lessons in a university-style course order", () => {
    expect(chapters.map((c) => c.id)).toEqual(["foundations", "classification", "evaluation", "trees", "patterns", "neural", "deep", "generative"]);
    expect(chapters.map((c) => c.number)).toEqual(["01", "02", "03", "04", "05", "06", "07", "08"]);
    expect(lessons).toHaveLength(40);
    expect(new Set(lessons.map((l) => l.slug)).size).toBe(40);
    expect(lessons[0].slug).toBe("linear-regression");
    expect(lessons.at(-1)!.slug).toBe("reinforcement-learning");
    // Chapters are contiguous in course order.
    const order = lessons.map((l) => chapters.findIndex((c) => c.id === l.chapter));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it("the 14 built lessons are live, each with a registered module; the other 26 are coming soon", () => {
    const live = liveLessons().map((l) => l.slug);
    expect(live).toHaveLength(14);
    for (const slug of live) expect(hasLessonModule(slug), slug).toBe(true);
    for (const l of lessons.filter((x) => x.status === "soon")) expect(hasLessonModule(l.slug), l.slug).toBe(false);
  });

  it("nextLesson walks course order and ends; nextLiveLesson skips lessons still coming", () => {
    expect(nextLesson("linear-regression")?.slug).toBe("gradient-descent");
    expect(nextLesson("gradient-descent")?.slug).toBe("feature-scaling");
    expect(nextLiveLesson("gradient-descent")?.slug).toBe("logistic-regression");
    expect(nextLesson("reinforcement-learning")).toBeUndefined();
    expect(nextLiveLesson("attention-transformers")).toBeUndefined();
  });

  it("groups lessons by chapter and numbers them from 1", () => {
    expect(lessonsInChapter("classification").map((l) => l.slug)).toEqual([
      "perceptron",
      "logistic-regression",
      "naive-bayes",
      "k-nearest-neighbors",
      "support-vector-machine",
      "kernel-trick",
    ]);
    expect(lessonIndex("linear-regression")).toBe(1);
    expect(lessonIndex("attention-transformers")).toBe(36);
    expect(lessonIndex("reinforcement-learning")).toBe(40);
  });
});
