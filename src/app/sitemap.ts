import type { MetadataRoute } from "next";
import { liveLessons } from "@/course/manifest";
import { SITE_URL } from "@/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["/", "/about/", "/privacy/", "/terms/",...liveLessons().map((l) => `/lessons/${l.slug}/`)];
  return pages.map((p) => ({ url: new URL(p, SITE_URL).toString() }));
}
