import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { liveLessons } from "@/course/manifest";
import { DEFAULT_LOCALE, LOCALES } from "@/i18n/locales";
import { LessonContentSchema, type LessonContent } from "./schema";

const dir = path.join(process.cwd(), "content");
const json = (...p: string[]) => JSON.parse(readFileSync(path.join(dir, ...p), "utf8"));
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const bold = (s: string) => (s.match(/\*\*/g) ?? []).length;
/** Formulas and code in backticks stay exactly as written. */
const code = (s: string) => s.match(/`[^`]*`/g) ?? [];
/** Numbers as written in the English text (claims are measured, so they must survive translation). */
const numbers = (s: string) => [...new Set(s.replace(/`[^`]*`/g, "").match(/\d+(?:\.\d+)?/g) ?? [])];

const en = json(DEFAULT_LOCALE, "ui.json") as Record<string, string>;
const others = LOCALES.filter((l) => l !== DEFAULT_LOCALE);

describe.each(others)("%s interface strings", (locale) => {
  const ui = json(locale, "ui.json") as Record<string, string>;

  it("has exactly the English keys (plus plural variants of them)", () => {
    const variants = Object.keys(ui).filter((k) => k.includes("|"));
    expect(Object.keys(ui).filter((k) => !k.includes("|")).sort()).toEqual(Object.keys(en).sort());
    for (const k of variants) {
      const [base, category] = k.split("|");
      expect(base in en, k).toBe(true);
      expect(["zero", "one", "two", "few", "many", "other"], k).toContain(category);
      for (const p of placeholders(ui[k])) expect(placeholders(en[base]), k).toContain(p);
    }
  });

  it("keeps every {placeholder} and **bold** pair", () => {
    for (const k of Object.keys(en)) {
      expect(placeholders(ui[k]), k).toEqual(placeholders(en[k]));
      expect(bold(ui[k]) % 2, k).toBe(0);
    }
  });

  it("is actually translated (not a copy of English) for sentences", () => {
    const sentences = Object.keys(en).filter((k) => en[k].split(" ").length >= 6);
    const same = sentences.filter((k) => ui[k] === en[k]);
    expect(same).toEqual([]);
  });
});

/** Every text field of a lesson, keyed by its path, for pairwise checks. */
function texts(c: LessonContent): Record<string, string> {
  const out: Record<string, string> = { title: c.title, description: c.description };
  c.youWillLearn.forEach((t, i) => (out[`learn.${i}`] = t));
  c.story.forEach((s) => {
    out[`story.${s.id}.title`] = s.title;
    out[`story.${s.id}.body`] = s.body;
    out[`story.${s.id}.keyIdea`] = s.keyIdea;
    if (s.math) out[`story.${s.id}.math`] = s.math;
  });
  for (const [k, e] of Object.entries(c.events)) {
    out[`event.${k}.title`] = e.title;
    out[`event.${k}.body`] = e.body;
  }
  out.breakIt = c.lab.breakIt;
  for (const [k, v] of Object.entries(c.lab.errors)) out[`error.${k}`] = v;
  c.article.sections.forEach((s, i) => {
    out[`section.${i}.heading`] = s.heading;
    out[`section.${i}.body`] = s.body;
  });
  c.article.faq.forEach((f, i) => {
    out[`faq.${i}.q`] = f.q;
    out[`faq.${i}.a`] = f.a;
  });
  if (c.byHand) {
    out["byHand.problem"] = c.byHand.problem;
    out["byHand.answer"] = c.byHand.answer;
    if (c.byHand.labNote) out["byHand.labNote"] = c.byHand.labNote;
    c.byHand.steps.forEach((s) => {
      out[`byHand.${s.id}.title`] = s.title;
      out[`byHand.${s.id}.body`] = s.body;
    });
  }
  return out;
}

const pairs = others.flatMap((locale) =>
  liveLessons()
    .map((l) => l.slug)
    .filter((slug) => existsSync(path.join(dir, locale, "lessons", `${slug}.json`)))
    .map((slug) => [locale, slug] as const),
);

describe.each(pairs)("%s translation of %s", (locale, slug) => {
  const source = LessonContentSchema.parse(json(DEFAULT_LOCALE, "lessons", `${slug}.json`));
  const target = LessonContentSchema.parse(json(locale, "lessons", `${slug}.json`));

  it("has the same structure", () => {
    expect(target.story.map((s) => [s.id, s.frameTag, s.reveal, !!s.math])).toEqual(source.story.map((s) => [s.id, s.frameTag, s.reveal, !!s.math]));
    expect(Object.keys(target.events).sort()).toEqual(Object.keys(source.events).sort());
    expect(Object.keys(target.stats).sort()).toEqual(Object.keys(source.stats).sort());
    expect(Object.keys(target.lab.presets).sort()).toEqual(Object.keys(source.lab.presets).sort());
    expect(Object.keys(target.lab.params).sort()).toEqual(Object.keys(source.lab.params).sort());
    expect(Object.keys(target.lab.errors).sort()).toEqual(Object.keys(source.lab.errors).sort());
    expect(target.youWillLearn).toHaveLength(source.youWillLearn.length);
    expect(target.article.faq).toHaveLength(source.article.faq.length);
    expect(target.article.sections.map((s) => s.table && [s.table.headers.length, s.table.rows.map((r) => r.length)])).toEqual(
      source.article.sections.map((s) => s.table && [s.table.headers.length, s.table.rows.map((r) => r.length)]),
    );
    expect(target.byHand?.steps.map((s) => s.id)).toEqual(source.byHand?.steps.map((s) => s.id));
    expect(Object.keys(target.byHand?.labels ?? {}).sort()).toEqual(Object.keys(source.byHand?.labels ?? {}).sort());
  });

  it("keeps every {placeholder}, formula, **bold** pair and every number the English text states", () => {
    const a = texts(source);
    const b = texts(target);
    expect(Object.keys(b).sort()).toEqual(Object.keys(a).sort());
    for (const k of Object.keys(a)) {
      expect(placeholders(b[k]), k).toEqual(placeholders(a[k]));
      // Word order differs between languages, so formulas may appear in another order.
      expect(code(b[k]).sort(), k).toEqual(code(a[k]).sort());
      expect(bold(b[k]) % 2, k).toBe(0);
      for (const n of numbers(a[k])) expect(b[k], `${k} lost the number ${n}`).toContain(n);
    }
  });
});
