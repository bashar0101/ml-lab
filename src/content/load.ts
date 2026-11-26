import { access, readFile } from "node:fs/promises";
import path from "node:path";
import type { z } from "zod";
import { LessonContentSchema, UiSchema, type LessonContent, type UiStrings } from "./schema";

import { DEFAULT_LOCALE, type Locale } from "@/i18n/locales";

export { DEFAULT_LOCALE };

const CONTENT_DIR = path.join(process.cwd(), "content");

async function readJson<T>(file: string, schema: z.ZodType<T>): Promise<T> {
  let raw: string;
  try {
    raw = await readFile(file, "utf8");
  } catch {
    throw new Error(`Invalid content: ${file}: file not found`);
  }
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Invalid content: ${file}: ${(e as Error).message}`);
  }
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(`Invalid content: ${file}: ${issue.path.join(".") || "(root)"}: ${issue.message}`);
  }
  return parsed.data;
}

export function loadUi(locale: string): Promise<UiStrings> {
  return readJson(path.join(CONTENT_DIR, locale, "ui.json"), UiSchema);
}

export function loadLesson(locale: string, slug: string): Promise<LessonContent> {
  return readJson(path.join(CONTENT_DIR, locale, "lessons", `${slug}.json`), LessonContentSchema);
}

/** A lesson in the given language, or the English text (fallback: true) until it is translated. */
export async function loadLessonFor(locale: Locale, slug: string): Promise<{ content: LessonContent; fallback: boolean }> {
  if (locale !== DEFAULT_LOCALE) {
    const file = path.join(CONTENT_DIR, locale, "lessons", `${slug}.json`);
    const exists = await access(file).then(
      () => true,
      () => false,
    );
    if (exists) return { content: await loadLesson(locale, slug), fallback: false };
  }
  return { content: await loadLesson(DEFAULT_LOCALE, slug), fallback: locale !== DEFAULT_LOCALE };
}
