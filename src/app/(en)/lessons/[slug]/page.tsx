import { lessonMetadata, lessonStaticParams, LessonView } from "@/views/LessonView";

export const dynamicParams = false;
export const generateStaticParams = lessonStaticParams;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  return lessonMetadata("en", (await params).slug);
}

export default async function LessonPage({ params }: Props) {
  return <LessonView locale="en" slug={(await params).slug} />;
}
