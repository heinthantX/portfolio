import { expect, test } from "@playwright/test";

test.describe("Contact Form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/contact");
  });

  test("empty submit shows field validation messages", async ({ page }) => {
    const submitButton = page.getByRole("button", { name: "Send message" });
    await submitButton.click();

    await expect(page.getByText("Name must be at least 2 characters")).toBeVisible();
    await expect(page.getByText("Please enter a valid email address")).toBeVisible();
    await expect(page.getByText("Message must be at least 10 characters")).toBeVisible();
  });

  test("valid data shows success state", async ({ page }) => {
    await page.getByLabel(/^name/i).fill("Test User");
    await page.getByLabel(/^email/i).fill("test@example.com");
    await page
      .getByLabel(/^message/i)
      .fill(
        "Hello, this is a valid message that has well over thirty characters to satisfy validation.",
      );

    const submitButton = page.getByRole("button", { name: "Send message" });
    await submitButton.click();

    const statusMessage = page.getByRole("status");
    await expect(statusMessage).toBeVisible({ timeout: 15000 });
    await expect(statusMessage).toContainText("Message sent");
  });

  test("email 'ratelimit@example.com' shows rate-limited state", async ({ page }) => {
    await page.getByLabel(/^name/i).fill("Test User");
    await page.getByLabel(/^email/i).fill("ratelimit@example.com");
    await page
      .getByLabel(/^message/i)
      .fill(
        "Hello, this is a test message to verify the rate-limited behavior in the contact form.",
      );

    const submitButton = page.getByRole("button", { name: "Send message" });
    await submitButton.click();

    const alertMessage = page.getByRole("alert").filter({ hasText: "Rate limit reached" });
    await expect(alertMessage).toBeVisible({ timeout: 15000 });
    await expect(alertMessage).toContainText("Rate limit reached");
  });
});
