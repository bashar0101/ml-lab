import Link from "next/link";
import { localePath, type Locale } from "@/i18n/locales";
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

export function Footer({ strings, locale = "en" }: { strings: FooterStrings; locale?: Locale }) {
  const to = (p: string) => localePath(locale, p);
  return (
    <footer className={styles.footer}>
      <span className={styles.name}>{strings.name}</span>
      <span>{strings.line}</span>
      <nav className={styles.links} aria-label={strings.name}>
        <Link href={to("/about/")}>{strings.about}</Link>
        <a href={`mailto:${CONTACT_EMAIL}`}>{strings.contact}</a>
        <Link href={to("/privacy/")}>{strings.privacy}</Link>
        <Link href={to("/terms/")}>{strings.terms}</Link>
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
          {strings.github}
        </a>
      </nav>
    </footer>
  );
}
