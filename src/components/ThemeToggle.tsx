"use client";

import { useEffect, useState } from "react";
import { THEME_KEY, type Theme } from "@/state/theme";
import styles from "./TopBar.module.css";

export function ThemeToggle({ toLight, toDark }: { toLight: string; toDark: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "dark" ? "dark" : "light");
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // storage blocked: the theme still applies for this visit
    }
    setTheme(next);
  }

  const label = theme === "dark" ? toLight : toDark;
  return (
    <button type="button" className={styles.chip} onClick={toggle} aria-label={label} title={label}>
      <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
    </button>
  );
}
