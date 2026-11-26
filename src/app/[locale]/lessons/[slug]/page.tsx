import type { Locale } from "@/i18n/locales";
import { lessonMetadata, lessonStaticParams, LessonView } from "@/views/LessonView";

export const dynamicParams = false;
export const generateStaticParams = lessonStaticParams;

type Props = { params: Promise<{ locale: Locale; slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  return lessonMetadata(locale, slug);
}

export default async function LessonPage({ params }: Props) {
  const { locale, slug } = await params;
  return <LessonView locale={locale} slug={slug} />;
}
