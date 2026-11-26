import type { Metadata } from "next";
import styles from "@/components/prose.module.css";
import { Markdownish } from "@/components/Markdownish";
import { loadUi } from "@/content/load";
import { alternates, localePath, type Locale } from "@/i18n/locales";

export type ProsePage = "about" | "privacy" | "terms";

export async function proseMetadata(locale: Locale, page: ProsePage): Promise<Metadata> {
  const ui = await loadUi(locale);
  const path = `/${page}/`;
  return {
    title: `${ui[`${page}.title`]} · ${ui["site.name"]}`,
    description: ui[`${page}.description`],
    alternates: { canonical: localePath(locale, path), languages: alternates(path) },
  };
}

export async function ProseView({ locale, page }: { locale: Locale; page: ProsePage }) {
  const ui = await loadUi(locale);
  return (
    <main className={styles.prose}>
      <h1>{ui[`${page}.title`]}</h1>
      <Markdownish text={ui[`${page}.body`]} />
    </main>
  );
}
