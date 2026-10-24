import { defineConfig, devices } from "@playwright/test";

const webgl = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"];
// Own port: e2e always runs against a production build, never a dev server on :3000.
const port = process.env.E2E_PORT ?? "3100";
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  // Software WebGL (swiftshader) starves parallel browsers on CI runners.
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL, trace: "retain-on-failure" },
  webServer: {
    command: `pnpm start -p ${port}`,
    url: baseURL,
    // Enables the contact form's deterministic test paths (ratelimit@example.com, logged send).
    env: { CONTACT_TEST_HOOKS: "1" },
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], launchOptions: { args: webgl } } },
    { name: "mobile", use: { ...devices["Pixel 7"], launchOptions: { args: webgl } } },
  ],
});
