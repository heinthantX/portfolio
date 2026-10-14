import { expect, test } from "@playwright/test";

test("home loads", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.status()).toBe(200);
});
