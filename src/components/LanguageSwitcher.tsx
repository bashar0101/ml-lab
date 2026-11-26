"use client";

import { usePathname } from "next/navigation";
import { useT } from "@/i18n/ui-context";
import { LOCALE_NAMES, LOCALES, localeFromPath, localePath } from "@/i18n/locales";
import styles from "./TopBar.module.css";

/** Same page in another language. A full page load, so <html lang dir> is right from the first paint. */
export function LanguageSwitcher() {
  const t = useT();
  const { locale, path } = localeFromPath(usePathname() ?? "/");
  return (
    <details className={styles.lang}>
      <summary className={styles.chip} aria-label={t("lang.label")}>
        {locale.toUpperCase()}
      </summary>
      <ul className={styles.langMenu}>
        {LOCALES.map((l) => (
          <li key={l}>
            <a
              href={localePath(l, path)}
              hrefLang={l}
              lang={l}
              aria-current={l === locale ? "true" : undefined}
              onClick={(e) => {
                if (window.location.hash) e.currentTarget.href = localePath(l, path) + window.location.hash;
              }}
            >
              {LOCALE_NAMES[l]}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}
