import type { Metadata } from "next";
import styles from "@/components/prose.module.css";
import { Markdownish } from "@/components/Markdownish";
import { DEFAULT_LOCALE, loadUi } from "@/content/load";

export async function generateMetadata(): Promise<Metadata> {
  const ui = await loadUi(DEFAULT_LOCALE);
  return {
    title: `${ui["about.title"]} · ${ui["site.name"]}`,
    description: ui["about.description"],
    alternates: { canonical: "/about/" },
  };
}

export default async function About() {
  const ui = await loadUi(DEFAULT_LOCALE);
  return (
    <main className={styles.prose}>
      <h1>{ui["about.title"]}</h1>
      <Markdownish text={ui["about.body"]} />
    </main>
  );
}
