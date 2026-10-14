import { expect, test } from "@playwright/test";

test.describe("Hero Scene & Timeline", () => {
  test("desktop hero canvas, chapter rail navigation, and scroll persistence", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "desktop project only");

    await page.goto("/");

    // [data-stack-hero] present
    const hero = page.locator("[data-stack-hero]");
    await expect(hero).toBeVisible();

    // a canvas appears inside [data-stack-stage] within 15s
    const stage = page.locator("[data-stack-stage]");
    await expect(stage).toBeVisible();
    const canvas = stage.locator("canvas");
    await expect(canvas).toBeAttached({ timeout: 15000 });

    // the chapter rail buttons exist (6)
    const railButtons = page.locator('nav[aria-label="Hero chapters"] button');
    await expect(railButtons).toHaveCount(6);

    const initialScrollY = await page.evaluate(() => window.scrollY);

    // clicking the 4th rail button (0-indexed: 3)
    await railButtons.nth(3).click();

    // scrolls the page down (window.scrollY increases)
    await expect
      .poll(async () => page.evaluate(() => window.scrollY), {
        timeout: 5000,
      })
      .toBeGreaterThan(initialScrollY);

    // and after ~2s the 4th becomes active (read whatever aria-current / data-active the rail uses)
    await expect(railButtons.nth(3)).toHaveAttribute("data-active", "true", {
      timeout: 5000,
    });
    await expect(railButtons.nth(3)).toHaveAttribute("aria-current", "step");

    // reload at that scroll position keeps it active
    await page.reload();
    await expect(railButtons.nth(3)).toHaveAttribute("data-active", "true", {
      timeout: 5000,
    });
    await expect(railButtons.nth(3)).toHaveAttribute("aria-current", "step");
  });

  test.describe("Reduced Motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("reduced motion: no canvas, poster img visible, chapter headings in normal flow", async ({
      page,
    }) => {
      await page.goto("/");

      // no canvas in the hero
      const hero = page.locator("[data-stack-hero]");
      await expect(hero).toBeVisible();
      await expect(hero.locator("canvas")).toHaveCount(0);

      // the poster <img> for the current theme is visible
      const poster = hero.locator("img:visible");
      await expect(poster).toBeVisible();

      // all chapter headings (Interface, API, Data, Infrastructure, Shipped) are visible in normal flow
      const headings = ["Interface", "API", "Data", "Infrastructure", "Shipped"];
      for (const heading of headings) {
        await expect(
          hero.getByRole("heading", { name: new RegExp(`^${heading}`, "i") }),
        ).toBeVisible();
      }
    });
  });
});
