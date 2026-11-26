import { expect, test } from "@playwright/test";

test("home lists 14 lessons with 1 live and links into lesson 1", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Watch machines");
  await expect(page.locator("[data-lesson-status=live]")).toHaveCount(1);
  await expect(page.locator("[data-lesson-status=soon]")).toHaveCount(13);
  await expect(page.locator("[data-chapter-card]")).toHaveCount(6);
  await page.getByRole("link", { name: /Start with linear regression/ }).click();
  await expect(page).toHaveURL(/\/lessons\/linear-regression\/$/);
  await expect(page.getByText("Step 1 / 6")).toBeVisible();
  expect(errors).toEqual([]);
});

test("the hero demo animates", async ({ page }) => {
  await page.goto("/");
  const dot = page.locator("[data-hero-demo] [data-part=current]");
  await expect(dot).toBeVisible();
  const a = await dot.getAttribute("cy");
  await expect.poll(async () => dot.getAttribute("cy"), { timeout: 4000 }).not.toBe(a);
});

test("reduced motion shows a still demo", async ({ browser }) => {
  const page = await browser.newPage({ reducedMotion: "reduce" });
  await page.goto("/");
  const dot = page.locator("[data-hero-demo] [data-part=current]");
  await expect(dot).toBeVisible();
  const a = await dot.getAttribute("cy");
  await page.waitForTimeout(800);
  expect(await dot.getAttribute("cy")).toBe(a);
  await page.close();
});

test("about page", async ({ page }) => {
  await page.goto("/about/");
  await expect(page.getByRole("heading", { level: 1, name: "About ML Lab" })).toBeVisible();
});

test("unknown page shows the 404", async ({ page }) => {
  await page.goto("/nope/");
  await expect(page.getByText("Lost in the loss landscape.")).toBeVisible();
});

test("sitemap and robots", async ({ request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/lessons/linear-regression/");
  expect(sitemap).toContain("/about/");
  expect(await (await request.get("/robots.txt")).text()).toContain("Sitemap:");
});

test("footer has Contact, Privacy, Terms of Service and GitHub links that work", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  await expect(footer.getByRole("link", { name: "Contact" })).toHaveAttribute("href", /^mailto:.+@.+/);
  await expect(footer.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", "https://github.com/bashar0101");
  await footer.getByRole("link", { name: "Privacy" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Privacy" })).toBeVisible();
  await page.getByRole("contentinfo").getByRole("link", { name: "Terms of Service" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Terms of Service" })).toBeVisible();
});
