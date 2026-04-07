import { expect, type Page } from "@playwright/test"

/**
 * Known demo users seeded by `npm run db:seed` (see prisma/seed.ts).
 *
 * These credentials only exist in a seeded test / dev database. The authed
 * playwright project is gated behind the `E2E_AUTHED=1` env var so it never
 * runs against production.
 */
export const DEMO_USERS = {
  admin: { email: "admin@foxolog.com", password: "admin123" },
  brandTechGlow: { email: "brand@techglow.com", password: "demo123" },
  brandFitFuel: { email: "brand@fitfuel.com", password: "demo123" },
  brandUrbanStyle: { email: "brand@urbanstyle.com", password: "demo123" },
  creatorEmily: { email: "creator@emilydance.com", password: "demo123" },
  creatorAlex: { email: "creator@alextech.com", password: "demo123" },
  creatorSofia: { email: "creator@sofiafood.com", password: "demo123" },
  creatorJames: { email: "creator@jamesfitness.com", password: "demo123" },
  creatorLily: { email: "creator@lilybeauty.com", password: "demo123" },
  network: { email: "network@viralreach.com", password: "demo123" },
  agency: { email: "agency@mediabuy.com", password: "demo123" },
  accountManager: { email: "am@foxolog.com", password: "demo123" },
} as const

export type DemoUser = keyof typeof DEMO_USERS

/**
 * Landing paths that each role is redirected to after login by the middleware.
 * Keep this in sync with `src/middleware.ts` (`roleDashboard` and
 * `dashboardMap`).
 */
export const ROLE_DASHBOARDS: Record<string, RegExp> = {
  admin: /\/admin\/users/,
  brandTechGlow: /\/brand(\/|$)/,
  brandFitFuel: /\/brand(\/|$)/,
  brandUrbanStyle: /\/brand(\/|$)/,
  creatorEmily: /\/creator(\/|$)/,
  creatorAlex: /\/creator(\/|$)/,
  creatorSofia: /\/creator(\/|$)/,
  creatorJames: /\/creator(\/|$)/,
  creatorLily: /\/creator(\/|$)/,
  network: /\/network(\/|$)/,
  agency: /\/agency(\/|$)/,
  accountManager: /\/account-manager\/clients/,
}

/**
 * Log in through the credentials form. Returns once the middleware has
 * redirected to the role-specific dashboard landing page.
 *
 * Uses the password form rather than directly setting a session cookie so
 * that these tests also exercise the login page, next-auth credentials
 * provider, and the middleware redirect.
 */
export async function loginAs(page: Page, user: DemoUser): Promise<void> {
  const creds = DEMO_USERS[user]
  await page.goto("/login")
  await page.locator("#email").fill(creds.email)
  await page.locator("#password").fill(creds.password)
  await page.getByRole("button", { name: /sign in|log in/i }).click()
  // Wait for the middleware redirect away from /login. The role-specific
  // landing page URL depends on the user's role.
  await page.waitForURL(ROLE_DASHBOARDS[user], { timeout: 15_000 })
  await expect(page).toHaveURL(ROLE_DASHBOARDS[user])
}
