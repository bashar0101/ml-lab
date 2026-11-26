import { DEFAULT_LOCALE, loadLesson, loadUi } from "@/content/load";
import { getChapter, getLesson, lessonIndex, lessons, liveLessons } from "@/course/manifest";
import { ogCard } from "@/og/card";

// Real .png files (out/og/<name>.png), so any static host serves them as images.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ file: "site.png" }, ...liveLessons().map((l) => ({ file: `${l.slug}.png` }))];
}

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const slug = file.replace(/\.png$/, "");
  const ui = await loadUi(DEFAULT_LOCALE);
  if (slug === "site") {
    return ogCard({
      eyebrow: ui["site.tagline"],
      title: ui["home.title"].replace(/\*/g, ""),
      description: ui["site.description"],
      accent: "#cfe3b2",
      footer: ui["og.siteFooter"].replace("{n}", String(lessons.length)),
    });
  }
  const content = await loadLesson(DEFAULT_LOCALE, slug);
  const entry = getLesson(slug)!;
  const chapter = getChapter(entry.chapter);
  return ogCard({
    eyebrow: `${chapter.number} · ${ui[`chapter.${chapter.id}`]}`,
    title: content.title,
    description: content.description,
    accent: chapter.color,
    footer: ui["og.lessonFooter"].replace("{n}", String(lessonIndex(slug))).replace("{total}", String(lessons.length)).replace("{minutes}", String(entry.minutes)),
  });
}
