import { expect, test } from "@playwright/test";

test.describe("Theme preferences", () => {
  test.describe("colorScheme 'dark'", () => {
    test.use({ colorScheme: "dark" });

    test("with colorScheme dark first visit has html.dark; clicking toggle switches to light and survives reload", async ({
      page,
    }) => {
      await page.goto("/");
      await expect(page.locator("html")).toHaveClass(/\bdark\b/);

      const toggleButton = page.getByRole("button", {
        name: "Toggle light and dark theme",
      });
      await toggleButton.click();

      await expect(page.locator("html")).toHaveClass(/\blight\b/);

      const storedTheme = await page.evaluate(() => localStorage.getItem("theme"));
      expect(storedTheme).toBe("light");

      await page.reload();
      await expect(page.locator("html")).toHaveClass(/\blight\b/);
    });
  });

  test.describe("colorScheme 'light'", () => {
    test.use({ colorScheme: "light" });

    test("with colorScheme light first visit has html.light; clicking toggle switches to dark and survives reload", async ({
      page,
    }) => {
      await page.goto("/");
      await expect(page.locator("html")).toHaveClass(/\blight\b/);

      const toggleButton = page.getByRole("button", {
        name: "Toggle light and dark theme",
      });
      await toggleButton.click();

      await expect(page.locator("html")).toHaveClass(/\bdark\b/);

      const storedTheme = await page.evaluate(() => localStorage.getItem("theme"));
      expect(storedTheme).toBe("dark");

      await page.reload();
      await expect(page.locator("html")).toHaveClass(/\bdark\b/);
    });
  });
});
