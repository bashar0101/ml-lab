import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/i18n/locales";
import { searchIndexResponse } from "@/search/route";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.filter((l) => l !== DEFAULT_LOCALE).map((locale) => ({ locale }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ locale: string }> }) {
  return searchIndexResponse((await params).locale as Locale);
}
