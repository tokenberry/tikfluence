import { defineConfig, devices } from "@playwright/test"

/**
 * Smoke tests run against a deployed Foxolog instance.
 *
 * Defaults to production (https://www.foxolog.com). Override with `BASE_URL`
 * env var to point at a preview deployment or local dev server, e.g.:
 *
 *   BASE_URL=http://localhost:3000 npm run test:e2e
 *   BASE_URL=https://foxolog-git-feature-xyz.vercel.app npm run test:e2e
 *
 * Browsers: only chromium is needed for these tests. First-time setup:
 *
 *   npm run test:e2e:install   # downloads chromium (~150MB)
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never" }]]
    : "list",
  use: {
    baseURL: process.env.BASE_URL ?? "https://www.foxolog.com",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
})
