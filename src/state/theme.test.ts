import { describe, expect, it } from "vitest";
import { resolveTheme } from "./theme";

describe("resolveTheme", () => {
  it("uses stored theme when valid", () => {
    expect(resolveTheme("dark", false)).toBe("dark");
    expect(resolveTheme("light", true)).toBe("light");
  });
  it("falls back to system preference for missing or invalid values", () => {
    expect(resolveTheme(null, true)).toBe("dark");
    expect(resolveTheme("purple", false)).toBe("light");
  });
});
