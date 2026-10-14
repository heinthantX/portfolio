import fs from "node:fs";
import path from "node:path";
import { expect, type Page, test } from "@playwright/test";

function getMockSlugs(dirPath: string): string[] {
  const fullDir = path.resolve(process.cwd(), dirPath);
  return fs
    .readdirSync(fullDir)
    .filter((file) => file.endsWith(".mdx"))
    .filter((file) => {
      const content = fs.readFileSync(path.join(fullDir, file), "utf8");
      const match = content.match(/^---\s*([\s\S]*?)\s*---/);
      return match && /mock:\s*true/.test(match[1]);
    })
    .map((file) => {
      const content = fs.readFileSync(path.join(fullDir, file), "utf8");
      const slugMatch = content.match(/slug:\s*["']?([^"'\r\n]+)["']?/);
      return slugMatch ? slugMatch[1] : file.replace(/\.mdx$/, "");
    });
}

const mockWorkSlugs = getMockSlugs("content/work");
const mockNoteSlugs = getMockSlugs("content/notes");

const PRODUCTION_PAGES = ["/", "/work", "/notes"] as const;

for (const pagePath of PRODUCTION_PAGES) {
  test(`no SampleBadge on ${pagePath} in production build`, async ({ page }) => {
    await page.goto(pagePath);

    // Assert no SampleBadge text ("sample", case-insensitive, as rendered by SampleBadge)
    const sampleBadgeByText = page.locator("text=/^sample$/i");
    await expect(sampleBadgeByText).toHaveCount(0);

    const sampleBadgeByTitle = page.locator(
      '[title="Placeholder content — hidden in production builds"]',
    );
    await expect(sampleBadgeByTitle).toHaveCount(0);
  });
}

// Once the instant shell has streamed, notFound() cannot change the status (Next 16 streaming
// contract), so a hidden slug is either a hard 404 or the not-found UI with noindex.
async function expectNotFound(page: Page, url: string) {
  const res = await page.goto(url);
  if (res?.status() === 404) return;
  await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
  await expect(page.getByText(/404|not found/i).first()).toBeVisible();
}

for (const slug of mockWorkSlugs) {
  test(`mock case-study slug /work/${slug} is not found in production`, async ({ page }) => {
    await expectNotFound(page, `/work/${slug}`);
  });
}

for (const slug of mockNoteSlugs) {
  test(`mock note slug /notes/${slug} is not found in production`, async ({ page }) => {
    await expectNotFound(page, `/notes/${slug}`);
  });
}
