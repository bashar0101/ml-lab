import Link from "next/link";
import { SearchPalette } from "./SearchPalette";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./TopBar.module.css";

export interface TopBarStrings {
  home: string;
  toLight: string;
  toDark: string;
}

export function TopBar({ strings }: { strings: TopBarStrings }) {
  return (
    <header className={styles.bar}>
      <Link href="/" className={styles.logo} aria-label={strings.home}>
        ML <em>Lab</em>
      </Link>
      <SearchPalette />
      <div className={styles.end}>
        <ThemeToggle toLight={strings.toLight} toDark={strings.toDark} />
      </div>
    </header>
  );
}
