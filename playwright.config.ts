import { defineConfig, devices } from "@playwright/test"

/**
 * Foxolog Playwright configuration.
 *
 * There are two test projects:
 *
 * 1. **smoke** — runs the unauthenticated landing / legal / auth-page tests
 *    in `e2e/smoke.spec.ts`. Defaults to production (https://www.foxolog.com)
 *    and is safe to run against any deployment. This is what `npm run test:e2e`
 *    executes by default.
 *
 *      npm run test:e2e
 *      BASE_URL=https://foxolog-git-feature-xyz.vercel.app npm run test:e2e
 *
 * 2. **authed** — runs the authenticated role-based flows in
 *    `e2e/authed.spec.ts`. Requires a local dev server + a seeded database
 *    (`npm run db:seed`) because it logs in as the demo users created by the
 *    seed script. Gated behind `E2E_AUTHED=1` so it is NEVER run against
 *    production accidentally.
 *
 *      # terminal 1
 *      npm run db:seed
 *      npm run dev
 *
 *      # terminal 2
 *      E2E_AUTHED=1 BASE_URL=http://localhost:3000 npm run test:e2e
 *
 * Browsers: only chromium is needed. First-time setup:
 *
 *   npm run test:e2e:install   # downloads chromium (~150MB)
 */
const AUTHED_ENABLED = process.env.E2E_AUTHED === "1"
const BASE_URL = process.env.BASE_URL ?? "https://www.foxolog.com"

if (AUTHED_ENABLED && !BASE_URL.includes("localhost") && !BASE_URL.includes("127.0.0.1")) {
  throw new Error(
    `Refusing to run authed tests against non-local BASE_URL=${BASE_URL}. ` +
      `Authed tests rely on seeded demo users and must run against a local ` +
      `dev server (e.g. http://localhost:3000).`
  )
}

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
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "smoke",
      testMatch: /smoke\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"] },
    },
    ...(AUTHED_ENABLED
      ? [
          {
            name: "authed",
            testMatch: /(authed|mutation)\.spec\.ts$/,
            use: { ...devices["Desktop Chrome"] },
          },
        ]
      : []),
  ],
})
