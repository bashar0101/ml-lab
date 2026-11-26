import Link from "next/link";
import { CONTACT_EMAIL, GITHUB_URL } from "@/site";
import styles from "./Footer.module.css";

export interface FooterStrings {
  name: string;
  line: string;
  about: string;
  contact: string;
  privacy: string;
  terms: string;
  github: string;
}

export function Footer({ strings }: { strings: FooterStrings }) {
  return (
    <footer className={styles.footer}>
      <span className={styles.name}>{strings.name}</span>
      <span>{strings.line}</span>
      <nav className={styles.links} aria-label={strings.name}>
        <Link href="/about/">{strings.about}</Link>
        <a href={`mailto:${CONTACT_EMAIL}`}>{strings.contact}</a>
        <Link href="/privacy/">{strings.privacy}</Link>
        <Link href="/terms/">{strings.terms}</Link>
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
          {strings.github}
        </a>
      </nav>
    </footer>
  );
}
