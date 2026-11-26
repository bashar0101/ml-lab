import type { Metadata } from "next";
import styles from "@/components/prose.module.css";
import { Markdownish } from "@/components/Markdownish";
import { DEFAULT_LOCALE, loadUi } from "@/content/load";

export async function generateMetadata(): Promise<Metadata> {
  const ui = await loadUi(DEFAULT_LOCALE);
  return {
    title: `${ui["privacy.title"]} · ${ui["site.name"]}`,
    description: ui["privacy.description"],
    alternates: { canonical: "/privacy/" },
  };
}

export default async function Privacy() {
  const ui = await loadUi(DEFAULT_LOCALE);
  return (
    <main className={styles.prose}>
      <h1>{ui["privacy.title"]}</h1>
      <Markdownish text={ui["privacy.body"]} />
    </main>
  );
}
