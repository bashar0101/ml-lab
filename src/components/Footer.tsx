import Link from "next/link";
import styles from "./Footer.module.css";

export function Footer({ name, line, about }: { name: string; line: string; about: string }) {
  return (
    <footer className={styles.footer}>
      <span className={styles.name}>{name}</span>
      <span>{line}</span>
      <Link href="/about/">{about}</Link>
    </footer>
  );
}
