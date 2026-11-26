import { describe, expect, it } from "vitest";
import { alternates, dirOf, isLocale, LOCALES, localeFromPath, localePath } from "./locales";

describe("locales", () => {
  it("English, Arabic and Turkish; English is the default and has no URL prefix", () => {
    expect(LOCALES).toEqual(["en", "ar", "tr"]);
    expect(localePath("en", "/lessons/pca/")).toBe("/lessons/pca/");
    expect(localePath("ar", "/lessons/pca/")).toBe("/ar/lessons/pca/");
    expect(localePath("tr", "/")).toBe("/tr/");
  });

  it("only Arabic is right-to-left", () => {
    expect(LOCALES.map(dirOf)).toEqual(["ltr", "rtl", "ltr"]);
  });

  it("reads the locale and the bare path back from a URL path", () => {
    expect(localeFromPath("/ar/lessons/pca/")).toEqual({ locale: "ar", path: "/lessons/pca/" });
    expect(localeFromPath("/tr")).toEqual({ locale: "tr", path: "/" });
    expect(localeFromPath("/lessons/pca/")).toEqual({ locale: "en", path: "/lessons/pca/" });
    expect(localeFromPath("/arabic/")).toEqual({ locale: "en", path: "/arabic/" });
  });

  it("hreflang alternates for every locale plus x-default", () => {
    expect(alternates("/about/")).toEqual({ en: "/about/", ar: "/ar/about/", tr: "/tr/about/", "x-default": "/about/" });
  });

  it("isLocale guards unknown values", () => {
    expect(isLocale("ar")).toBe(true);
    expect(isLocale("fr")).toBe(false);
  });
});
