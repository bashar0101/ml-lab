import type { MetadataRoute } from "next";
import { liveLessons } from "@/course/manifest";
import { alternates, LOCALES, localePath } from "@/i18n/locales";
import { SITE_URL } from "@/site";

export const dynamic = "force-static";

/** Every page in every language, each listing its translations. */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["/", "/about/", "/privacy/", "/terms/", ...liveLessons().map((l) => `/lessons/${l.slug}/`)];
  const abs = (p: string) => new URL(p, SITE_URL).toString();
  return pages.flatMap((p) =>
    LOCALES.map((l) => ({
      url: abs(localePath(l, p)),
      alternates: { languages: Object.fromEntries(Object.entries(alternates(p)).map(([k, v]) => [k, abs(v)])) },
    })),
  );
}
