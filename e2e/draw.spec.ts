import { expect, test } from "@playwright/test";

// At 1920×950 the scene's height cap letterboxes the SVG: clicks must still land under the cursor.
test.use({ viewport: { width: 1920, height: 950 } });

test("draw your own: a click adds a point exactly where the cursor is", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "desktop only");
  await page.goto("/lessons/linear-regression/#lab");
  await page.getByRole("button", { name: "Draw your own" }).click();
  const svg = page.getByRole("img", { name: /Data points with the model/ });
  await expect(svg.locator("[data-part=draw-area]")).toBeVisible();

  // Data point (2, 50) on the custom 0–10 × 0–100 grid → SVG (62 + 0.2·298, 330 − 0.5·284).
  const target = { x: 62 + 0.2 * 298, y: 330 - 0.5 * 284 };
  const client = await svg.evaluate((el, t) => {
    const p = new DOMPoint(t.x, t.y).matrixTransform((el as SVGSVGElement).getScreenCTM()!);
    return { x: p.x, y: p.y };
  }, target);
  await page.mouse.click(client.x, client.y);

  const point = svg.locator("[data-part=point]");
  await expect(point).toHaveCount(1);
  expect(Math.abs(Number(await point.getAttribute("cx")) - target.x)).toBeLessThan(2);
  expect(Math.abs(Number(await point.getAttribute("cy")) - target.y)).toBeLessThan(2);
});
