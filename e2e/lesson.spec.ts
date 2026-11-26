import { expect, test } from "@playwright/test";

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
  expect((await request.get("/lessons/not-a-lesson/")).status()).toBe(404);
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
