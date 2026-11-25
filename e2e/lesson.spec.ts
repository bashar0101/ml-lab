import { expect, test } from "@playwright/test";

test("lesson 1: learn to the end, then lab plays", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/lessons/linear-regression/");
  await expect(page.getByText("Step 1 / 6")).toBeVisible();
  await expect(page.getByRole("img", { name: /Data points with the model/ })).toBeVisible();
  for (let i = 0; i < 5; i++) await page.getByRole("button", { name: /^Next:/ }).click();
  await expect(page.getByText("Step 6 / 6")).toBeVisible();
  await page.getByRole("button", { name: /Try it in the lab/ }).click();
  await expect(page).toHaveURL(/#lab$/);
  await page.getByRole("button", { name: "Play" }).click();
  await expect(page.getByText(/^([2-9]|\d{2,3}) \/ 122$/)).toBeVisible();
  expect(errors).toEqual([]);
});

test("deep link and keyboard", async ({ page }) => {
  await page.goto("/lessons/linear-regression/#step-3");
  await expect(page.getByText("Step 3 / 6")).toBeVisible();
  await page.locator("body").press("ArrowRight");
  await expect(page.getByText("Step 4 / 6")).toBeVisible();
});

test("article and metadata are in the static HTML", async ({ request }) => {
  const html = await (await request.get("/lessons/linear-regression/")).text();
  expect(html).toContain("<title>Linear Regression · ML Lab</title>");
  expect(html).toContain("What is linear regression?");
  expect(html).toContain("application/ld+json");
  expect(html).toContain('href="/lessons/linear-regression/"');
  expect(html).toContain("Can hours predict a score?");
});

test("unknown lesson slugs are not built", async ({ request }) => {
  expect((await request.get("/lessons/pca/")).status()).toBe(404);
});

test("phone: course menu opens and closes", async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "phone only");
  await page.goto("/lessons/linear-regression/");
  const link = page.getByRole("navigation", { name: "Course" }).getByRole("link", { name: "Linear Regression" });
  await expect(link).toBeHidden();
  await page.getByRole("button", { name: /course menu/i }).click();
  await expect(link).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(link).toBeHidden();
});
