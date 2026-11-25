import Link from "next/link";
import styles from "@/components/prose.module.css";
import { DEFAULT_LOCALE, loadUi } from "@/content/load";

export default async function NotFound() {
  const ui = await loadUi(DEFAULT_LOCALE);
  return (
    <main className={styles.prose}>
      <h1>{ui["notFound.title"]}</h1>
      <p>{ui["notFound.body"]}</p>
      <p>
        <Link href="/" className="btn btn-primary">
          {ui["notFound.home"]}
        </Link>
      </p>
    </main>
  );
}
