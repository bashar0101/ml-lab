import Link from "next/link";
import styles from "@/components/prose.module.css";
import { loadUi } from "@/content/load";
import { localePath, type Locale } from "@/i18n/locales";

export async function NotFoundView({ locale }: { locale: Locale }) {
  const ui = await loadUi(locale);
  return (
    <main className={styles.prose}>
      <h1>{ui["notFound.title"]}</h1>
      <p>{ui["notFound.body"]}</p>
      <p>
        <Link href={localePath(locale, "/")} className="btn btn-primary">
          {ui["notFound.home"]}
        </Link>
      </p>
    </main>
  );
}
