import { expect, test } from "@playwright/test";

test("search: Ctrl K, type, Enter opens the lesson", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Control+k");
  const box = page.getByRole("combobox", { name: "Search the course" });
  await expect(box).toBeFocused();
  await box.fill("backprop");
  await expect(page.getByRole("option").first()).toContainText("Backpropagation");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/lessons\/backpropagation\/$/);
  await expect(page.getByRole("heading", { level: 1, name: "Backpropagation" })).toBeVisible();
});

test("search: a step result opens that step", async ({ page }) => {
  await page.goto("/lessons/linear-regression/");
  await page.getByRole("button", { name: "Search lessons and ideas" }).click();
  await page.getByRole("combobox").fill("softmax");
  const step = page.getByRole("option").filter({ hasText: "Step" }).first();
  const href = await step.locator("a").getAttribute("href");
  expect(href).toMatch(/#step-\d+$/);
  await step.click();
  await expect(page).toHaveURL(new RegExp(href!.replace(/[.*+?^${}()|[\]\/]/g, "\$&") + "$"));
  await expect(page.getByText(/^Step \d \/ \d$/).first()).toHaveText(`Step ${href!.split("-").at(-1)} / 6`);
});

test("search index is a static file", async ({ request }) => {
  const res = await request.get("/search-index.json");
  expect(res.status()).toBe(200);
  const entries = await res.json();
  expect(entries.filter((e: { kind: string }) => e.kind === "lesson")).toHaveLength(14);
});
