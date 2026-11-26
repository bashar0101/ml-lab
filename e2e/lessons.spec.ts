import { expect, test } from "@playwright/test";
import { liveLessons } from "../src/course/manifest";

for (const { slug } of liveLessons()) {
  test(`${slug}: Learn walks to the end, Lab plays, no console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`/lessons/${slug}/`);
    const counter = page.getByText(/^Step 1 \/ (\d+)$/);
    await expect(counter).toBeVisible();
    const total = Number((await counter.textContent())!.split("/")[1]);
    for (let i = 1; i < total; i++) await page.getByRole("button", { name: /^Next:/ }).click();
    await expect(page.getByText(`Step ${total} / ${total}`)).toBeVisible();
    await page.getByRole("button", { name: /Try it in the lab/ }).click();
    await expect(page).toHaveURL(/#lab$/);
    await page.getByRole("button", { name: "Play" }).click();
    await expect(page.getByText(/^([2-9]|\d{2,4}) \/ \d+$/)).toBeVisible();
    expect(errors).toEqual([]);
  });
}
