export type Theme = "light" | "dark";

export const THEME_KEY = "mllab:theme";

export function resolveTheme(stored: string | null, systemDark: boolean): Theme {
  if (stored === "light" || stored === "dark") return stored;
  return systemDark ? "dark" : "light";
}

/** Runs in <head> before first paint: sets data-theme on <html>. Mirrors resolveTheme. */
export const themeBootstrapScript =
  "(function(){var t=null;try{t=localStorage.getItem(" +
  JSON.stringify(THEME_KEY) +
  ")}catch(e){}if(t!=='light'&&t!=='dark'){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',t)})()";
