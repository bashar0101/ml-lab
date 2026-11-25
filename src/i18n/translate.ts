import type { UiStrings } from "@/content/schema";
import { interpolate } from "@/engine/text";

/** Look up a UI string and fill its {placeholders}. A missing key returns the key itself. */
export function translate(strings: UiStrings, key: string, vars?: Record<string, string | number>): string {
  const template = strings[key];
  if (template === undefined) {
    if (process.env.NODE_ENV !== "production") console.warn(`Missing UI string: ${key}`);
    return key;
  }
  return vars ? interpolate(template, vars, (_k, v) => String(v)) : template;
}
