import { expect, test } from "@playwright/test";

test.describe("Command Menu", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "desktop project only");
    await page.goto("/", { waitUntil: "networkidle" });
  });

  test("Escape closes dialog", async ({ page }) => {
    await page.keyboard.press("ControlOrMeta+KeyK");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible({ timeout: 10000 });
  });

  test("typing projects lists projects and choosing one navigates", async ({ page }) => {
    await page.keyboard.press("ControlOrMeta+KeyK");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const input = page.getByPlaceholder("Type a command or search...");
    await input.fill("projects");

    const projectOption = dialog.getByRole("option", { name: /portfolio/i });
    await expect(projectOption).toBeVisible({ timeout: 3000 });
    await projectOption.click();

    await expect(page).toHaveURL(/\/work\/this-portfolio/, { timeout: 15000 });
  });
});
