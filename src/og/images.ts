import { OG_SIZE } from "./card";

/** Open Graph image entry for /og/<name>.png (built by app/og/[file]/route.ts). */
export function ogImage(name: string, alt: string) {
  return { url: `/og/${name}.png`, ...OG_SIZE, alt, type: "image/png" };
}
