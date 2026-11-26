import { DEFAULT_LOCALE, dirOf, LOCALES } from "./locales";

const others = LOCALES.filter((l) => l !== DEFAULT_LOCALE);
const rtl = others.filter((l) => dirOf(l) === "rtl");

/** Sets <html lang dir> from the URL before first paint (the static build also stamps them). */
export const localeBootstrapScript =
  "(function(){var m=location.pathname.match(/^\\/(" +
  others.join("|") +
  ")(\\/|$)/);var l=m?m[1]:" +
  JSON.stringify(DEFAULT_LOCALE) +
  ";var d=document.documentElement;d.setAttribute('lang',l);d.setAttribute('dir'," +
  JSON.stringify(rtl) +
  ".indexOf(l)>=0?'rtl':'ltr')})()";
