import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const ROUTES = [
  "/",
  "/work",
  "/work/this-portfolio",
  "/notes",
  "/resume",
  "/uses",
  "/contact",
  "/does-not-exist",
] as const;

const THEMES = ["dark", "light"] as const;

for (const theme of THEMES) {
  test.describe(`A11y audits (${theme} mode)`, () => {
    for (const route of ROUTES) {
      test(`route ${route} has zero serious or critical a11y violations`, async ({ page }) => {
        await page.addInitScript((t) => {
          localStorage.setItem("theme", t);
        }, theme);

        await page.goto(route);
        await page.waitForLoadState("domcontentloaded");
        // Scroll reveals leave below-the-fold text mid-fade; axe would score that opacity as low contrast.
        await page.addStyleTag({
          content:
            "[data-reveal], [data-w], [data-line], .animate-pulse { animation: none !important; opacity: 1 !important; filter: none !important; }",
        });

        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .exclude("canvas")
          .analyze();

        const seriousOrCritical = results.violations.filter(
          (v) => v.impact === "serious" || v.impact === "critical",
        );

        if (seriousOrCritical.length > 0) {
          const formatted = seriousOrCritical.map((v) => ({
            id: v.id,
            impact: v.impact,
            description: v.description,
            targets: v.nodes.map((n) => n.target),
          }));
          console.error(
            `A11y violations for route ${route} (${theme}):\n${JSON.stringify(formatted, null, 2)}`,
          );
        }

        expect(
          seriousOrCritical,
          `Expected 0 serious/critical violations on ${route} (${theme}), found: ${JSON.stringify(
            seriousOrCritical.map((v) => ({
              id: v.id,
              impact: v.impact,
              targets: v.nodes.map((n) => n.target),
            })),
          )}`,
        ).toHaveLength(0);
      });
    }
  });
}
