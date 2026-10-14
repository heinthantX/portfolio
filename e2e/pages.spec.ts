import { expect, test } from "@playwright/test";

const IGNORED_ERRORS =
  /WebGL|GPU stall|swiftshader|ReadPixels|THREE\.Clock|Download the React DevTools/i;

const HTML_ROUTES = [
  "/",
  "/work",
  "/work/this-portfolio",
  "/notes",
  "/resume",
  "/uses",
  "/contact",
] as const;

const NON_HTML_ROUTES = ["/notes/rss.xml", "/sitemap.xml", "/robots.txt"] as const;

for (const route of HTML_ROUTES) {
  test(`HTML route ${route} status 200, one h1, non-empty title, clean console`, async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => {
      const msg = err.message || String(err);
      if (!IGNORED_ERRORS.test(msg)) {
        consoleErrors.push(`[pageerror] ${msg}`);
      }
    });
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        if (!IGNORED_ERRORS.test(text)) {
          consoleErrors.push(`[console.error] ${text}`);
        }
      }
    });

    const res = await page.goto(route);
    expect(res?.status()).toBe(200);

    const title = await page.title();
    expect(title.trim().length).toBeGreaterThan(0);

    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBe(1);

    expect(consoleErrors).toEqual([]);
  });
}

for (const route of NON_HTML_ROUTES) {
  test(`non-HTML route ${route} status 200`, async ({ page }) => {
    const res = await page.goto(route);
    expect(res?.status()).toBe(200);
  });
}

test("route /does-not-exist returns 404 and shows 404 text", async ({ page }) => {
  const res = await page.goto("/does-not-exist");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: /layer not found/i })).toBeVisible();
  await expect(page.getByText("404")).toBeVisible();
});
