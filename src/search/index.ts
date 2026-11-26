import type { LessonContent } from "@/content/schema";
import { DEFAULT_LOCALE, localePath, type Locale } from "@/i18n/locales";

export interface SearchEntry {
  href: string;
  title: string;
  /** The lesson's title, shown under every result. */
  lesson: string;
  kind: "lesson" | "step" | "topic" | "faq";
  text: string;
}

/** Drops the light markdown used in lesson text (bold, italics, code, links). */
export function plain(md: string): string {
  return md
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildSearchIndex(items: { slug: string; content: LessonContent }[], locale: Locale = DEFAULT_LOCALE): SearchEntry[] {
  const out: SearchEntry[] = [];
  for (const { slug, content: c } of items) {
    const page = localePath(locale, `/lessons/${slug}/`);
    const lesson = c.title;
    out.push({ href: page, title: lesson, lesson, kind: "lesson", text: plain([c.description, ...c.youWillLearn].join(" ")) });
    c.story.forEach((s, k) =>
      out.push({ href: `${page}#step-${k + 1}`, title: plain(s.title), lesson, kind: "step", text: plain(`${s.keyIdea} ${s.body}`) }),
    );
    for (const s of c.article.sections) out.push({ href: page, title: plain(s.heading), lesson, kind: "topic", text: plain(s.body) });
    for (const f of c.article.faq) out.push({ href: page, title: plain(f.q), lesson, kind: "faq", text: plain(f.a) });
  }
  return out;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const KIND_BOOST: Record<SearchEntry["kind"], number> = { lesson: 6, step: 2, topic: 1, faq: 0 };

/** Every query word must appear somewhere; title matches count most, then the lesson name, then the text. */
export function searchEntries(entries: SearchEntry[], query: string, limit = 8): SearchEntry[] {
  const words = norm(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const scored: { e: SearchEntry; score: number; i: number }[] = [];
  entries.forEach((e, i) => {
    const title = norm(e.title);
    const lesson = norm(e.lesson);
    const text = norm(e.text);
    let score = 0;
    for (const w of words) {
      const inTitle = title.includes(w);
      const inLesson = lesson.includes(w);
      if (!inTitle && !inLesson && !text.includes(w)) return;
      if (inTitle) score += title.startsWith(w) || title.includes(` ${w}`) ? 12 : 8;
      if (inLesson) score += 3;
      if (!inTitle && !inLesson) score += 1;
    }
    // A lesson that only mentions the word still beats a step or FAQ that only mentions it.
    score += words.some((w) => title.includes(w)) ? KIND_BOOST[e.kind] : KIND_BOOST[e.kind] / 3;
    scored.push({ e, score, i });
  });
  scored.sort((a, b) => b.score - a.score || a.i - b.i);
  return scored.slice(0, limit).map((s) => s.e);
}
