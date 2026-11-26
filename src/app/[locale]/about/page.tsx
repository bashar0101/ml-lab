import type { Locale } from "@/i18n/locales";
import { proseMetadata, ProseView } from "@/views/ProseView";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props) {
  return proseMetadata((await params).locale, "about");
}

export default async function About({ params }: Props) {
  return <ProseView locale={(await params).locale} page="about" />;
}
