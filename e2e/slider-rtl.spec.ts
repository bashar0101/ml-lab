import { expect, test } from "@playwright/test";

const LESSONS = [
  "linear-regression", "gradient-descent", "logistic-regression", "k-nearest-neighbors", "support-vector-machine",
  "decision-tree", "random-forest", "k-means", "pca", "neural-network", "backpropagation",
  "convolutional-neural-network", "recurrent-neural-network", "attention-transformers",
];

/** Labels whose value number is drawn on top of the label's words. */
async function overlaps(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const bad: string[] = [];
    for (const out of document.querySelectorAll("output")) {
      const label = out.previousElementSibling;
      if (!label || label.tagName !== "LABEL") continue;
      const range = document.createRange();
      range.selectNodeContents(label);
      const words = range.getBoundingClientRect();
      const num = out.getBoundingClientRect();
      if (!words.width || !num.width) continue;
      const apart = num.right <= words.left + 0.5 || num.left >= words.right - 0.5 || num.bottom <= words.top || num.top >= words.bottom;
      if (!apart) bad.push(`${label.textContent} / ${out.textContent}`);
    }
    return bad;
  });
}

for (const locale of ["ar", "en"]) {
  test(`${locale}: slider numbers never cover their labels`, async ({ page }) => {
    const bad: string[] = [];
    for (const slug of LESSONS) {
      await page.goto(`/${locale === "en" ? "" : `${locale}/`}lessons/${slug}/#lab`);
      await page.getByRole("heading", { level: 2 }).first().waitFor();
      await page.locator("output").first().waitFor({ state: "attached", timeout: 3000 }).catch(() => {});
      for (const o of await overlaps(page)) bad.push(`${slug}: ${o}`);
    }
    expect(bad).toEqual([]);
  });
}
