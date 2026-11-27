import { expect, test } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test("a first visit to lesson 1 gets the guided tour, once", async ({ page }) => {
  await page.goto("/lessons/linear-regression/");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Read the story");
  for (let i = 0; i < 4; i++) await dialog.getByRole("button", { name: "Next", exact: true }).click();
  await expect(dialog).toContainText("Your data and settings");
  await expect(page.getByRole("group", { name: "Lesson mode" }).getByRole("button", { name: "Lab" })).toHaveAttribute("aria-pressed", "true");
  for (let i = 0; i < 5; i++) await dialog.getByRole("button", { name: "Next", exact: true }).click();
  await expect(dialog).toContainText("Find anything");
  await dialog.getByRole("button", { name: "Start learning" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText("Step 1 / 6")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Step 1 / 6")).toBeVisible();
  await page.waitForTimeout(600);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Take the tour" }).click();
  await expect(page.getByRole("dialog")).toContainText("Read the story");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("other lessons and shared links don't start it", async ({ page }) => {
  await page.goto("/lessons/pca/");
  await page.waitForTimeout(600);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goto("/lessons/linear-regression/#lab");
  await page.waitForTimeout(600);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
