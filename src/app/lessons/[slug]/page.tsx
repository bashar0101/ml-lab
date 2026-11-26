import type { Metadata } from "next";
import { LessonArticle } from "@/components/LessonArticle";
import { LessonWorkspace } from "@/components/workspace/LessonWorkspace";
import { DEFAULT_LOCALE, loadLesson, loadUi } from "@/content/load";
import { getLesson, liveLessons } from "@/course/manifest";
import { ogImage } from "@/og/images";

export const dynamicParams = false;

export function generateStaticParams() {
  return liveLessons().map((l) => ({ slug: l.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [content, ui] = await Promise.all([loadLesson(DEFAULT_LOCALE, slug), loadUi(DEFAULT_LOCALE)]);
  const title = `${content.title} · ${ui["site.name"]}`;
  return {
    title,
    description: content.description,
    openGraph: { title, description: content.description, type: "article", siteName: ui["site.name"], images: [ogImage(slug, content.title)] },
    twitter: { card: "summary_large_image", title, description: content.description },
    alternates: { canonical: `/lessons/${slug}/` },
  };
}

export default async function LessonPage({ params }: Props) {
  const { slug } = await params;
  const [content, ui] = await Promise.all([loadLesson(DEFAULT_LOCALE, slug), loadUi(DEFAULT_LOCALE)]);
  const entry = getLesson(slug)!;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: content.title,
    description: content.description,
    educationalLevel: ui[`level.${entry.level}`],
    timeRequired: `PT${entry.minutes}M`,
    inLanguage: DEFAULT_LOCALE,
    isAccessibleForFree: true,
    learningResourceType: "Interactive lesson",
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <LessonWorkspace slug={slug} content={content} />
      <LessonArticle slug={slug} content={content} ui={ui} />
    </main>
  );
}
