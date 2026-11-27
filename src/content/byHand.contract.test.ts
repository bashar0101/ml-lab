import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { liveLessons } from "@/course/manifest";
import { LOCALES } from "@/i18n/locales";
import { byHandFor } from "@/lessons/byHand";
import type { HandBlock } from "@/lessons/shared/hand";
import { LessonContentSchema } from "./schema";

const keys = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
const blockText = (b: HandBlock) => ("math" in b ? b.math : [b.table.caption ?? "", b.table.headers, ...b.table.rows, b.table.foot ?? []].flat());

const cases = LOCALES.flatMap((locale) => liveLessons().map((l) => [locale, l.slug] as const));

describe.each(cases)("%s %s: solve it by hand", (locale, slug) => {
  const content = LessonContentSchema.parse(JSON.parse(readFileSync(path.join(process.cwd(), "content", locale, "lessons", `${slug}.json`), "utf8")));
  const example = byHandFor(slug)!;
  const text = content.byHand!;

  it("has the words for every computed step, in order", () => {
    expect(text, "content.byHand missing").toBeDefined();
    expect(text.steps.map((s) => s.id)).toEqual(example.steps.map((s) => s.id));
  });

  it("has a word for every {label} in the tables and formulas", () => {
    const blocks = [...example.given, ...example.steps.flatMap((s) => s.blocks)];
    const vars = Object.assign({}, example.vars, ...example.steps.map((s) => s.vars ?? {}));
    const used = new Set([...blocks.flatMap(blockText), ...Object.values(vars) as string[]].flatMap(keys));
    for (const k of used) expect(text.labels, `label {${k}}`).toHaveProperty(k);
  });

  it("fills every {placeholder} in the prose", () => {
    const vars = Object.assign({}, example.vars, ...example.steps.map((s) => s.vars ?? {}));
    const known = new Set([...Object.keys(vars), ...Object.keys(text.labels)]);
    for (const s of [text.problem, text.answer, ...text.steps.flatMap((s) => [s.title, s.body])]) {
      for (const k of keys(s)) expect(known.has(k), `{${k}} in "${s}"`).toBe(true);
    }
  });

  it("never uses one name for both a number and a word", () => {
    const vars = Object.assign({}, example.vars, ...example.steps.map((s) => s.vars ?? {}));
    expect(Object.keys(vars).filter((k) => k in text.labels)).toEqual([]);
  });
});
