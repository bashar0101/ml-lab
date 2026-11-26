import { DEFAULT_LOCALE, loadLesson } from "@/content/load";
import { liveLessons } from "@/course/manifest";
import { buildSearchIndex } from "@/search";

export const dynamic = "force-static";

/** Written to out/search-index.json at build time; the search palette fetches it on first open. */
export async function GET() {
  const items = await Promise.all(liveLessons().map(async (l) => ({ slug: l.slug, content: await loadLesson(DEFAULT_LOCALE, l.slug) })));
  return Response.json(buildSearchIndex(items));
}
