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
  test("Tab completes page titles, not just commands", async ({ page }) => {
    await page.keyboard.press("ControlOrMeta+KeyK");
    const input = page.getByPlaceholder("Type a command or search...");
    await input.fill("wo");
    await page.keyboard.press("Tab");
    await expect(input).toHaveValue("Work");
  });

  test("arrow keys walk the help output and Enter runs the command", async ({ page }) => {
    await page.keyboard.press("ControlOrMeta+KeyK");
    const dialog = page.getByRole("dialog");
    const input = page.getByPlaceholder("Type a command or search...");
    await input.fill("help");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await expect(dialog.locator("[data-out][data-selected]")).toHaveText("whoami");
    await expect(dialog.locator("[data-out][data-selected]")).not.toHaveCSS(
      "background-color",
      "rgba(0, 0, 0, 0)",
    );
    await page.keyboard.press("ArrowUp");
    await expect(dialog.locator("[data-out][data-selected]")).toHaveText("help");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(input).toHaveValue("whoami");
  });

  test("the gold window light closes the palette", async ({ page }) => {
    await page.keyboard.press("ControlOrMeta+KeyK");
    const dialog = page.getByRole("dialog");
    await expect(page.getByPlaceholder("Type a command or search...")).toBeFocused();
    // the dot is tiny: click it once the open zoom has finished, not mid-scale
    await dialog.evaluate((el) =>
      Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished)),
    );
    await dialog.getByRole("button", { name: "Close command palette" }).click();
    // the closed state is the behaviour; the unmount waits on an exit animation that software GL starves
    await expect(page.locator('[role="dialog"][data-state="open"]')).toHaveCount(0);
  });
});
