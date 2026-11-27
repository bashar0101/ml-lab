import type { Metadata } from "next";
import { ByHand } from "@/components/ByHand";
import { LessonArticle } from "@/components/LessonArticle";
import { byHandFor, LAB_EXAMPLES } from "@/lessons/byHand";
import prose from "@/components/prose.module.css";
import { LessonWorkspace } from "@/components/workspace/LessonWorkspace";
import { loadLessonFor, loadUi } from "@/content/load";
import { getLesson, liveLessons } from "@/course/manifest";
import { alternates, localePath, type Locale } from "@/i18n/locales";
import { ogImage } from "@/og/images";

export const lessonStaticParams = () => liveLessons().map((l) => ({ slug: l.slug }));

export async function lessonMetadata(locale: Locale, slug: string): Promise<Metadata> {
  const [{ content }, ui] = await Promise.all([loadLessonFor(locale, slug), loadUi(locale)]);
  const title = `${content.title} · ${ui["site.name"]}`;
  const path = `/lessons/${slug}/`;
  return {
    title,
    description: content.description,
    openGraph: { title, description: content.description, type: "article", siteName: ui["site.name"], locale, images: [ogImage(slug, content.title)] },
    twitter: { card: "summary_large_image", title, description: content.description },
    alternates: { canonical: localePath(locale, path), languages: alternates(path) },
  };
}

export async function LessonView({ locale, slug }: { locale: Locale; slug: string }) {
  const [{ content, fallback }, ui] = await Promise.all([loadLessonFor(locale, slug), loadUi(locale)]);
  const entry = getLesson(slug)!;
  // Computed here at build time, so the example's code never ships to the browser.
  const example = byHandFor(slug);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: content.title,
    description: content.description,
    educationalLevel: ui[`level.${entry.level}`],
    timeRequired: `PT${entry.minutes}M`,
    inLanguage: fallback ? "en" : locale,
    isAccessibleForFree: true,
    learningResourceType: "Interactive lesson",
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\u003c") }} />
      {fallback && (
        <p className={prose.notice} role="note" data-fallback>
          {ui["lesson.notTranslated"]}
        </p>
      )}
      <div lang={fallback ? "en" : undefined} dir={fallback ? "ltr" : undefined}>
        <LessonWorkspace slug={slug} content={content} tour={slug === "linear-regression"} />
        {example && content.byHand && <ByHand example={example} text={content.byHand} inLab={LAB_EXAMPLES.has(slug)} />}
        <LessonArticle slug={slug} content={content} ui={ui} locale={locale} />
      </div>
    </main>
  );
}
