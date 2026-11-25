// Fails when the lesson page ships more than 200 KB of gzipped JavaScript.
// Counts every /_next/ script referenced by the built lesson page, plus the lesson
// module chunks it loads on demand (found via the page's own chunk references).
import { readFileSync } from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";

const OUT = path.resolve("out");
const PAGE = path.join(OUT, "lessons", "linear-regression", "index.html");
const LIMIT_KB = 200;

const html = readFileSync(PAGE, "utf8");
const srcs = new Set([...html.matchAll(/(?:src|href)="(\/_next\/[^"]+?\.js)"/g)].map((m) => m[1]));
// Lazy chunks are listed in the RSC payload / scripts as "static/chunks/....js".
for (const m of html.matchAll(/static\/chunks\/[\w\-./~]+?\.js/g)) srcs.add(`/_next/${m[0]}`);

// Follow chunk references inside loaded chunks (lazy imports such as the lesson module).
const queue = [...srcs];
while (queue.length) {
  const src = queue.pop();
  let text;
  try {
    text = readFileSync(path.join(OUT, src), "utf8");
  } catch {
    continue;
  }
  for (const m of text.matchAll(/static\/chunks\/[\w\-./~]+?\.js/g)) {
    const ref = `/_next/${m[0]}`;
    if (!srcs.has(ref)) {
      srcs.add(ref);
      queue.push(ref);
    }
  }
}

let total = 0;
const rows = [];
for (const src of srcs) {
  let buf;
  try {
    buf = readFileSync(path.join(OUT, src));
  } catch {
    continue;
  }
  const kb = gzipSync(buf).length / 1024;
  total += kb;
  rows.push([kb, src]);
}
rows.sort((a, b) => b[0] - a[0]);
for (const [kb, src] of rows.slice(0, 8)) console.log(`${kb.toFixed(1).padStart(7)} KB  ${src}`);
console.log(`total: ${total.toFixed(1)} KB gzipped across ${rows.length} files (limit ${LIMIT_KB} KB)`);
if (rows.length === 0) {
  console.error("no scripts found — is out/ built?");
  process.exit(1);
}
process.exit(total > LIMIT_KB ? 1 : 0);
