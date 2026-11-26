import { describe, expect, it } from "vitest";
import { siteUrl } from "./site";

describe("siteUrl", () => {
  it("prefers an explicit NEXT_PUBLIC_SITE_URL, without a trailing slash", () => {
    expect(siteUrl({ NEXT_PUBLIC_SITE_URL: "https://ml-lab.dev/", VERCEL_PROJECT_PRODUCTION_URL: "x.vercel.app" })).toBe("https://ml-lab.dev");
  });
  it("falls back to the Vercel production domain during a Vercel build", () => {
    expect(siteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "ml-lab.vercel.app" })).toBe("https://ml-lab.vercel.app");
  });
  it("uses the local preview server otherwise", () => {
    expect(siteUrl({})).toBe("http://localhost:3100");
  });
});
