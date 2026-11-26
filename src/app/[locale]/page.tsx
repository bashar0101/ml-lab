import type { Locale } from "@/i18n/locales";
import { homeMetadata, HomeView } from "@/views/HomeView";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props) {
  return homeMetadata((await params).locale);
}

export default async function Home({ params }: Props) {
  return <HomeView locale={(await params).locale} />;
}
