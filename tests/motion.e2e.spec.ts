import { expect, test } from "@playwright/test";

test("shows the first screen immediately and reveals lower content once", async ({ page }) => {
  await page.goto("/");
  const hero = page.locator("#inicio .nv-reveal").first();
  await expect(hero).toHaveCSS("opacity", "1");
  await expect(hero).toHaveCSS("transform", "none");
  const brand = page.locator(".header-brand-name");
  const brandSize = await brand.boundingBox();
  const section = page.locator("#servicios .nv-reveal").first();
  await expect(section).toHaveAttribute("data-reveal", "pending");
  await section.evaluate(el => window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - window.innerHeight - 60, behavior: "instant" }));
  // Start the entrance before the content reaches the viewport, not after it.
  await expect(section).toHaveAttribute("data-reveal", "visible");
  await expect(section).toHaveCSS("opacity", "1");
  expect((await brand.boundingBox())!.width).toBeCloseTo(brandSize!.width, 0);
  expect((await brand.boundingBox())!.height).toBeCloseTo(brandSize!.height, 0);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(section).toHaveAttribute("data-reveal", "visible");
  await section.scrollIntoViewIfNeeded();
  await expect(section).toHaveCSS("opacity", "1");
  await page.screenshot({ path: `test-results/motion-services-${test.info().project.name}.png`, animations: "disabled" });
});

test("keeps anchor destinations and all content visible with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#contacto");
  await expect(page.locator("#contacto h2")).toBeInViewport();
  await expect(page.locator(".nv-scroll-progress")).not.toBeVisible();
  expect(await page.locator(".nv-reveal").evaluateAll(elements => elements.every(el => getComputedStyle(el).opacity === "1" && getComputedStyle(el).transform === "none"))).toBe(true);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.reload();
  await expect(page.locator('[data-reveal="pending"]').first()).toBeAttached();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator('[data-reveal="pending"]')).toHaveCount(0);
});

test("falls back to readable content without intersection observers", async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, "IntersectionObserver", { value: undefined, configurable: true }); });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(await page.locator(".nv-reveal").evaluateAll(elements => elements.every(el => getComputedStyle(el).opacity === "1"))).toBe(true);
  await page.locator("#contacto").scrollIntoViewIfNeeded();
  await expect(page.locator("#contacto h2")).toBeVisible();
});

test("keeps progress synchronized when page height changes", async ({ page }) => {
  await page.goto("/");
  const progress = page.locator(".nv-scroll-progress > div");
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  await expect.poll(() => progress.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).a)).toBeCloseTo(1, 2);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect.poll(() => progress.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).a)).toBe(0);
  await page.getByRole("button", { name: "¿Qué debo llevar a mi primera consulta?" }).click();
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  await expect.poll(() => progress.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).a)).toBeCloseTo(1, 2);
});
