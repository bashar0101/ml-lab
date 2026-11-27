import { describe, expect, it } from "vitest";
import ar from "../../content/ar/ui.json";
import en from "../../content/en/ui.json";
import tr from "../../content/tr/ui.json";
import { translate } from "./translate";

describe("plural-aware strings", () => {
  it("Arabic minutes: 1 دقيقة, 2 دقيقتان, 3–10 دقائق, 11+ دقيقة", () => {
    const m = (n: number) => translate(ar, "lesson.minutes", { n });
    expect(m(1)).toBe("1 دقيقة");
    expect(m(2)).toBe("دقيقتان");
    for (const n of [3, 8, 10]) expect(m(n)).toBe(`${n} دقائق`);
    for (const n of [11, 12, 15, 99]) expect(m(n)).toBe(`${n} دقيقة`);
  });

  it("Arabic lesson counts follow the same rules", () => {
    expect(translate(ar, "course.lessons", { n: 40 })).toBe("40 درسًا");
    expect(translate(ar, "course.lessons", { n: 5 })).toBe("5 دروس");
    expect(translate(ar, "home.chapters.count", { n: 6, live: 2 })).toBe("6 دروس · 2 متاح");
  });

  it("languages without variants keep their single form", () => {
    expect(translate(en, "lesson.minutes", { n: 8 })).toBe("8 min");
    expect(translate(tr, "lesson.minutes", { n: 8 })).toBe("8 dk");
  });

  it("strings without a locale or without n are untouched", () => {
    expect(translate({ "x|few": "few", x: "base {n}" }, "x", { n: 3 })).toBe("base 3");
    expect(translate(ar, "lesson.minutes")).toBe("{n} دقيقة");
  });
});
