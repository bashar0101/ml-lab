import { loadLessonFor } from "@/content/load";
import { liveLessons } from "@/course/manifest";
import type { Locale } from "@/i18n/locales";
import { buildSearchIndex } from "./index";

export async function searchIndexResponse(locale: Locale): Promise<Response> {
  const items = await Promise.all(liveLessons().map(async (l) => ({ slug: l.slug, content: (await loadLessonFor(locale, l.slug)).content })));
  return Response.json(buildSearchIndex(items, locale));
}
