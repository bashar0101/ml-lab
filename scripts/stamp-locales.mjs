// After `next build`: the single root layout writes <html lang="en" dir="ltr">; give every page under
// out/<locale>/ its own language and direction so it is right before any script runs.
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve("out");
const LOCALES = { ar: "rtl", tr: "ltr" };
let stamped = 0;

async function walk(dir, lang, dirAttr) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, lang, dirAttr);
    else if (entry.name.endsWith(".html")) {
      const html = await readFile(full, "utf8");
      const next = html.replace(/<html lang="en" dir="ltr"/, `<html lang="${lang}" dir="${dirAttr}"`);
      if (next === html) throw new Error(`stamp-locales: no <html lang="en" dir="ltr"> in ${full}`);
      await writeFile(full, next);
      stamped++;
    }
  }
}

for (const [lang, dirAttr] of Object.entries(LOCALES)) await walk(path.join(OUT, lang), lang, dirAttr);
console.log(`stamp-locales: ${stamped} pages`);
