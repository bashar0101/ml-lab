"use client";

import { useSyncExternalStore } from "react";
import { THEME_KEY, type Theme } from "@/state/theme";
import styles from "./TopBar.module.css";

function subscribe(onChange: () => void) {
  const obs = new MutationObserver(onChange);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}

const getTheme = (): Theme => (document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");

export function ThemeToggle({ toLight, toDark }: { toLight: string; toDark: string }) {
  // The server doesn't know the theme; the bootstrap script sets it before paint.
  const theme = useSyncExternalStore<Theme | null>(subscribe, getTheme, () => null);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // storage blocked: the theme still applies for this visit
    }
  }

  const label = theme === "dark" ? toLight : toDark;
  return (
    <button type="button" className={styles.chip} onClick={toggle} aria-label={label} title={label}>
      <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
    </button>
  );
}
