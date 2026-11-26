import { expect, test } from "@playwright/test";
import { liveLessons } from "../src/course/manifest";

const ogImage = (html: string) => /<meta property="og:image" content="([^"]+)"/.exec(html)?.[1];

test("home and every lesson have an Open Graph image that is a real PNG", async ({ request }) => {
  for (const path of ["/", ...liveLessons().map((l) => `/lessons/${l.slug}/`)]) {
    const html = await (await request.get(path)).text();
    const url = ogImage(html);
    expect(url, path).toBeTruthy();
    expect(html, path).toContain('<meta property="og:image:width" content="1200"');
    const res = await request.get(new URL(url!).pathname);
    expect(res.status(), url).toBe(200);
    expect(url).toMatch(/\/og\/[a-z-]+\.png$/);
    expect(res.headers()["content-type"]).toContain("image/png");
    const body = await res.body();
    expect(body.subarray(1, 4).toString(), url).toBe("PNG");
  }
});
