import Link from "next/link";
import { localePath, type Locale } from "@/i18n/locales";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SearchPalette } from "./SearchPalette";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./TopBar.module.css";

export interface TopBarStrings {
  home: string;
  toLight: string;
  toDark: string;
}

export function TopBar({ strings, locale = "en" }: { strings: TopBarStrings; locale?: Locale }) {
  return (
    <header className={styles.bar}>
      <Link href={localePath(locale, "/")} className={styles.logo} aria-label={strings.home}>
        ML <em>Lab</em>
      </Link>
      <SearchPalette />
      <div className={styles.end}>
        <LanguageSwitcher />
        <ThemeToggle toLight={strings.toLight} toDark={strings.toDark} />
      </div>
    </header>
  );
}
