import type { Metadata } from "next";
import styles from "@/components/prose.module.css";
import { Markdownish } from "@/components/Markdownish";
import { DEFAULT_LOCALE, loadUi } from "@/content/load";

export async function generateMetadata(): Promise<Metadata> {
  const ui = await loadUi(DEFAULT_LOCALE);
  return {
    title: `${ui["terms.title"]} · ${ui["site.name"]}`,
    description: ui["terms.description"],
    alternates: { canonical: "/terms/" },
  };
}

export default async function Terms() {
  const ui = await loadUi(DEFAULT_LOCALE);
  return (
    <main className={styles.prose}>
      <h1>{ui["terms.title"]}</h1>
      <Markdownish text={ui["terms.body"]} />
    </main>
  );
}
