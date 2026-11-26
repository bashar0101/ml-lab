import { existsSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

test("Arabic pages are right-to-left and translated", async ({ page }) => {
  await page.goto("/ar/");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("شاهد الآلات");
  await expect(page.getByRole("link", { name: "ابدأ بالانحدار الخطي" })).toHaveAttribute("href", "/ar/lessons/linear-regression/");
});

test("Turkish lesson page: Turkish interface, and a notice while the lesson text is still English", async ({ page }) => {
  await page.goto("/tr/lessons/pca/");
  await expect(page.locator("html")).toHaveAttribute("lang", "tr");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.getByRole("group", { name: "Ders modu" }).getByRole("button", { name: "Laboratuvar" })).toBeVisible();
  const translated = existsSync(path.join(process.cwd(), "content/tr/lessons/pca.json"));
  await expect(page.locator("[data-fallback]")).toHaveCount(translated ? 0 : 1);
});

test("the language switcher keeps the page and the step", async ({ page }) => {
  await page.goto("/lessons/pca/#step-3");
  await page.getByText("EN", { exact: true }).click();
  await page.getByRole("link", { name: "العربية" }).click();
  await expect(page).toHaveURL(/\/ar\/lessons\/pca\/#step-3$/);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByText(/^(الخطوة|Step) 3 \/ \d$/).first()).toBeVisible();
});

test("search in Turkish uses the Turkish index and links", async ({ page }) => {
  await page.goto("/tr/");
  await page.keyboard.press("Control+k");
  await page.getByRole("combobox").fill("pca");
  const first = page.getByRole("option").first().locator("a");
  await expect(first).toHaveAttribute("href", /^\/tr\/lessons\//);
});

test("sitemap lists every language with hreflang alternates", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  expect(xml).toContain("/ar/lessons/linear-regression/");
  expect(xml).toContain("/tr/about/");
  expect(xml).toContain('hreflang="ar"');
});
