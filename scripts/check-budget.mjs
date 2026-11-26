// Fails when any lesson page ships more than 200 KB of gzipped JavaScript.
// For each built lesson page: every /_next/ script the HTML references, plus the chunks
// those load on demand, except chunks that belong only to *other* lessons (a lesson page
// loads just its own lesson module).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";

const OUT = path.resolve("out");
const LESSONS_DIR = path.join(OUT, "lessons");
const LIMIT_KB = 200;

if (!existsSync(LESSONS_DIR)) {
  console.error("no out/lessons — run npm run build first");
  process.exit(1);
}
const slugs = readdirSync(LESSONS_DIR).filter((d) => existsSync(path.join(LESSONS_DIR, d, "index.html")));
const read = (src) => {
  try {
    return readFileSync(path.join(OUT, src));
  } catch {
    return null;
  }
};
const lessonsIn = (text) => slugs.filter((s) => text.includes(`slug:"${s}"`));

let failed = false;
for (const slug of slugs) {
  const html = readFileSync(path.join(LESSONS_DIR, slug, "index.html"), "utf8");
  const direct = new Set([...html.matchAll(/(?:src|href)="(\/_next\/[^"]+?\.js)"/g)].map((m) => m[1]));
  for (const m of html.matchAll(/static\/chunks\/[\w\-./~]+?\.js/g)) direct.add(`/_next/${m[0]}`);

  const counted = new Set(direct);
  const queue = [...direct];
  while (queue.length) {
    const buf = read(queue.pop());
    if (!buf) continue;
    for (const m of buf.toString("utf8").matchAll(/static\/chunks\/[\w\-./~]+?\.js/g)) {
      const ref = `/_next/${m[0]}`;
      if (counted.has(ref)) continue;
      const refBuf = read(ref);
      if (!refBuf) continue;
      const owners = lessonsIn(refBuf.toString("utf8"));
      // A lazy chunk that only belongs to other lessons is never loaded on this page.
      if (owners.length > 0 && !owners.includes(slug)) continue;
      counted.add(ref);
      queue.push(ref);
    }
  }

  let total = 0;
  for (const src of counted) {
    const buf = read(src);
    if (buf) total += gzipSync(buf).length / 1024;
  }
  const over = total > LIMIT_KB;
  failed ||= over;
  console.log(`${over ? "FAIL" : "ok  "} ${slug.padEnd(32)} ${total.toFixed(1).padStart(6)} KB gzipped (${counted.size} files)`);
}
console.log(`limit ${LIMIT_KB} KB per lesson page`);
process.exit(failed ? 1 : 0);
