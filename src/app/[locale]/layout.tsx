import { SiteShell } from "@/components/SiteShell";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/i18n/locales";

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.filter((l) => l !== DEFAULT_LOCALE).map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  return <SiteShell locale={(await params).locale as Locale}>{children}</SiteShell>;
}
