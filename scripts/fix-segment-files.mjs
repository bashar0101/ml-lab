// Next.js static export on Windows writes the router's prefetch files as nested folders
// (`__next.lessons/$d$slug/__PAGE__.txt`) because it joins paths with "\" and then only
// converts "/" to ".". The browser asks for `__next.lessons.$d$slug.__PAGE__.txt`.
// This flattens any such folders after `next build`; on other systems it finds nothing.
import { readdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve("out");

async function walk(dir) {
  for (const name of await readdir(dir)) {
    const full = path.join(dir, name);
    if (!(await stat(full)).isDirectory()) continue;
    if (name.startsWith("__next.")) await flatten(full, dir, name);
    else if (name !== "_next") await walk(full);
  }
}

async function flatten(folder, parent, prefix) {
  const files = await collect(folder);
  for (const rel of files) {
    const target = path.join(parent, `${prefix}.${rel.split(path.sep).join(".")}`);
    await rename(path.join(folder, rel), target);
    moved++;
  }
  await rm(folder, { recursive: true, force: true });
}

async function collect(dir, base = dir) {
  const out = [];
  for (const name of await readdir(dir)) {
    const full = path.join(dir, name);
    if ((await stat(full)).isDirectory()) out.push(...(await collect(full, base)));
    else out.push(path.relative(base, full));
  }
  return out;
}

let moved = 0;
await walk(OUT);
console.log(`fix-segment-files: ${moved} file(s) flattened`);
