import type { UiStrings } from "@/content/schema";
import { interpolate } from "@/engine/text";

/** Look up a UI string and fill its {placeholders}. A missing key returns the key itself. */
const rules = new Map<string, Intl.PluralRules>();

/** "<key>|<category>" (zero, one, two, few, many, other) for the number {n}, when the language defines it. */
function pluralKey(strings: UiStrings, key: string, vars?: Record<string, string | number>): string {
  const locale = strings["meta.locale"];
  if (!locale || typeof vars?.n !== "number") return key;
  let r = rules.get(locale);
  if (!r) rules.set(locale, (r = new Intl.PluralRules(locale)));
  const variant = `${key}|${r.select(vars.n)}`;
  return variant in strings ? variant : key;
}

export function translate(strings: UiStrings, key: string, vars?: Record<string, string | number>): string {
  const template = strings[pluralKey(strings, key, vars)];
  if (template === undefined) {
    if (process.env.NODE_ENV !== "production") console.warn(`Missing UI string: ${key}`);
    return key;
  }
  return vars ? interpolate(template, vars, (_k, v) => String(v)) : template;
}
