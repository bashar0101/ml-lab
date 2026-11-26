import type { Locale } from "@/i18n/locales";
import { proseMetadata, ProseView } from "@/views/ProseView";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props) {
  return proseMetadata((await params).locale, "terms");
}

export default async function Terms({ params }: Props) {
  return <ProseView locale={(await params).locale} page="terms" />;
}
