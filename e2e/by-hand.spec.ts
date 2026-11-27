import { expect, test, type Locator } from "@playwright/test";

/** Visible text without the invisible marks that keep numbers in order inside Arabic sentences. */
const plain = async (l: Locator) => ((await l.textContent()) ?? "").replace(/[\u2066-\u2069]/g, "");

test("a lesson page has a worked example that reveals one step at a time", async ({ page }) => {
  await page.goto("/lessons/k-nearest-neighbors/");
  const section = page.locator("section[aria-labelledby='by-hand']");
  await expect(section.getByRole("heading", { name: "Solve it by hand" })).toBeVisible();
  await expect(section.getByRole("listitem")).toHaveCount(0);

  await section.getByRole("button", { name: "Show step 1" }).click();
  await expect(section.getByRole("heading", { name: /The distance formula/ })).toBeFocused();

  await section.getByRole("button", { name: "Show all steps" }).click();
  await expect(section.getByRole("listitem")).toHaveCount(4);
  expect(await plain(section.getByTestId("answer"))).toContain("classified as good");
});

test("the Arabic page keeps formulas and numbers left to right", async ({ page }) => {
  await page.goto("/ar/lessons/linear-regression/");
  const section = page.locator("section[aria-labelledby='by-hand']");
  await expect(section.getByRole("heading", { name: "حلّها بيدك" })).toBeVisible();
  await section.getByRole("button", { name: "أظهِر كل الخطوات" }).click();
  expect(await plain(section.getByTestId("answer"))).toContain("ŷ = −72x + 968");
  const math = section.locator("[dir='ltr']").first();
  await expect(math).toBeVisible();
  // Every negative number, in sentences, formulas and tables, shows its minus sign on the left.
  const minus = await section.evaluate((root) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const bad: string[] = [];
    let checked = 0;
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const t = n.textContent ?? "";
      for (let i = t.indexOf("−"); i >= 0; i = t.indexOf("−", i + 1)) {
        if (!/\d/.test(t[i + 1] ?? "")) continue;
        const r = document.createRange();
        r.setStart(n, i);
        r.setEnd(n, i + 1);
        const sign = r.getBoundingClientRect();
        r.setStart(n, i + 1);
        r.setEnd(n, i + 2);
        const digit = r.getBoundingClientRect();
        checked++;
        if (!(sign.left < digit.left)) bad.push(t.slice(Math.max(0, i - 8), i + 6));
      }
    }
    return { checked, bad };
  });
  expect(minus.checked).toBeGreaterThan(10);
  expect(minus.bad).toEqual([]);
  // Nothing on the page scrolls sideways at phone width either.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
