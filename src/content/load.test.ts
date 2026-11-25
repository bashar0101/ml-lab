// @vitest-environment node
import { describe, expect, it } from "vitest";
import { chapters, lessons } from "@/course/manifest";
import { loadLesson, loadUi } from "./load";
import { LessonContentSchema } from "./schema";
import validFixture from "./__fixtures__/lesson.valid.json";

describe("content", () => {
  it("ui.json has a title for every lesson and chapter", async () => {
    const ui = await loadUi("en");
    for (const l of lessons) expect(ui[`lesson.${l.slug}.title`], l.slug).toBeTruthy();
    for (const c of chapters) expect(ui[`chapter.${c.id}`], c.id).toBeTruthy();
  });

  it("ui.json has the fixed labels", async () => {
    const ui = await loadUi("en");
    expect(ui).toMatchObject({
      "site.name": "ML Lab",
      "mode.learn": "Learn",
      "mode.lab": "Lab",
      "player.play": "Play",
      "player.pause": "Pause",
      "player.last": "Last",
      "player.scrubber": "Training step",
      "menu.open": "Open course menu",
      "lesson.pca.title": "Principal Component Analysis",
    });
  });

  it("accepts a valid lesson fixture and rejects a story with 5 steps", () => {
    expect(LessonContentSchema.safeParse(validFixture).success).toBe(true);
    expect(LessonContentSchema.safeParse({ ...validFixture, story: validFixture.story.slice(0, 5) }).success).toBe(false);
  });

  it("loadLesson names the file when it is missing or invalid", async () => {
    await expect(loadLesson("en", "does-not-exist")).rejects.toThrow(/does-not-exist/);
  });
});
