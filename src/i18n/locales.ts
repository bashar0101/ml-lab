export const LOCALES = ["en", "ar", "tr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

/** Each language in its own name, for the language switcher. */
export const LOCALE_NAMES: Record<Locale, string> = { en: "English", ar: "العربية", tr: "Türkçe" };

export const isLocale = (v: string): v is Locale => (LOCALES as readonly string[]).includes(v);

export const dirOf = (l: Locale): "ltr" | "rtl" => (l === "ar" ? "rtl" : "ltr");

/** English keeps its URLs; other languages live under /<locale>/. `path` starts with "/". */
export function localePath(locale: Locale, path: string): string {
  return locale === DEFAULT_LOCALE ? path : `/${locale}${path}`;
}

export function localeFromPath(pathname: string): { locale: Locale; path: string } {
  const m = /^\/([a-z]{2})(\/.*)?$/.exec(pathname);
  if (m && isLocale(m[1]) && m[1] !== DEFAULT_LOCALE) return { locale: m[1], path: m[2] ?? "/" };
  return { locale: DEFAULT_LOCALE, path: pathname };
}

/** `alternates.languages` for page metadata (hreflang). */
export function alternates(path: string): Record<string, string> {
  return { ...Object.fromEntries(LOCALES.map((l) => [l, localePath(l, path)])), "x-default": path };
}
