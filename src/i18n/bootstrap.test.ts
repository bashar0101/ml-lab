import { describe, expect, it } from "vitest";
import { localeBootstrapScript } from "./bootstrap";

const run = (pathname: string) => {
  const attrs: Record<string, string> = {};
  const fn = new Function("location", "document", localeBootstrapScript);
  fn({ pathname }, { documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v) } });
  return attrs;
};

describe("localeBootstrapScript", () => {
  it("sets lang and dir from the URL", () => {
    expect(run("/ar/lessons/pca/")).toEqual({ lang: "ar", dir: "rtl" });
    expect(run("/tr/")).toEqual({ lang: "tr", dir: "ltr" });
    expect(run("/tr")).toEqual({ lang: "tr", dir: "ltr" });
    expect(run("/lessons/pca/")).toEqual({ lang: "en", dir: "ltr" });
    expect(run("/arabic/")).toEqual({ lang: "en", dir: "ltr" });
  });
});
