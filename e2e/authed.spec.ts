import { test, expect } from "@playwright/test"
import { loginAs } from "./fixtures/auth"

/**
 * Authenticated role-based flows.
 *
 * These tests require a local dev server (`npm run dev`) and a seeded
 * database (`npm run db:seed`). They are gated by the `E2E_AUTHED=1` env
 * var in `playwright.config.ts` so they are NEVER run against production.
 *
 * Scope: every test is read-only. These tests assert that each role can
 * log in, reach their dashboard, and read the data seeded by
 * `prisma/seed.ts`. Mutation flows (creator accepts order → delivers →
 * brand approves) are deferred until the test setup can reset the database
 * between runs and mock Stripe/Payoneer — see PROGRESS.md for the plan.
 *
 *   # terminal 1
 *   npm run db:seed
 *   npm run dev
 *
 *   # terminal 2
 *   E2E_AUTHED=1 BASE_URL=http://localhost:3000 npm run test:e2e
 */

test.describe("auth flow", () => {
  test("credentials login → creator dashboard redirect", async ({ page }) => {
    await loginAs(page, "creatorEmily")
    // Seeded creator Emily Zhang has an assigned order #1 ("Smart Watch
    // Launch Video") — the creator dashboard should list it.
    await page.goto("/creator/orders")
    await expect(page.getByText(/smart watch launch video/i)).toBeVisible()
  })

  test("credentials login → brand dashboard redirect", async ({ page }) => {
    await loginAs(page, "brandTechGlow")
    await page.goto("/brand/orders")
    // Brand TechGlow owns the "Smart Watch Launch Video" order.
    await expect(page.getByText(/smart watch launch video/i)).toBeVisible()
  })

  test("credentials login → admin dashboard redirect", async ({ page }) => {
    await loginAs(page, "admin")
    // Admin lands on /admin/users — the users table should include the
    // seeded demo brand.
    await expect(page.getByText(/brand@techglow\.com/i)).toBeVisible()
  })

  test("credentials login → network dashboard redirect", async ({ page }) => {
    await loginAs(page, "network")
    // Network ViralReach has two creators in its roster (Emily + Alex).
    await page.goto("/network/creators")
    await expect(page.getByText(/emilydancez/i)).toBeVisible()
  })

  test("credentials login → agency dashboard redirect", async ({ page }) => {
    await loginAs(page, "agency")
    await page.goto("/agency/brands")
    // MediaBuy Agency manages TechGlow + FitFuel.
    await expect(page.getByText(/techglow/i)).toBeVisible()
  })

  test("credentials login → account-manager dashboard redirect", async ({
    page,
  }) => {
    await loginAs(page, "accountManager")
    // Account manager lands on /account-manager/clients — TechGlow is
    // assigned to Sarah Miller.
    await expect(page.getByText(/techglow/i)).toBeVisible()
  })
})

test.describe("creator order flow (read-only)", () => {
  test("creator views the IN_PROGRESS order that's assigned to them", async ({
    page,
  }) => {
    // Seed order #3: UrbanStyle → James (IN_PROGRESS).
    await loginAs(page, "creatorJames")
    await page.goto("/creator/orders")
    await expect(
      page.getByText(/summer streetwear lookbook/i)
    ).toBeVisible()
    // Clicking through to the detail page should show the brief.
    await page.getByText(/summer streetwear lookbook/i).first().click()
    await expect(page).toHaveURL(/\/creator\/orders\/[a-z0-9]+/i)
    await expect(
      page.getByText(/outfit transition trend/i)
    ).toBeVisible()
  })

  test("creator in REVISION sees the rejection reason", async ({ page }) => {
    // Seed order #6: UrbanStyle → Lily (REVISION, rejection reason set).
    await loginAs(page, "creatorLily")
    await page.goto("/creator/orders")
    await expect(
      page.getByText(/spring accessories haul/i)
    ).toBeVisible()
    await page.getByText(/spring accessories haul/i).first().click()
    await expect(
      page.getByText(/close-up shots of the jewelry/i)
    ).toBeVisible()
  })
})

test.describe("brand review flow (read-only)", () => {
  test("brand can see a DELIVERED order awaiting review", async ({ page }) => {
    // Seed order #2: FitFuel → Sofia (DELIVERED, awaiting approval).
    await loginAs(page, "brandFitFuel")
    await page.goto("/brand/orders")
    await expect(
      page.getByText(/protein shake morning routine/i)
    ).toBeVisible()
    await page.getByText(/protein shake morning routine/i).first().click()
    // The delivery should be visible on the detail page, including the
    // creator's submitted TikTok link.
    await expect(
      page.getByText(/tiktok\.com\/@sofiacooks/i)
    ).toBeVisible()
  })

  test("brand can browse creators", async ({ page }) => {
    await loginAs(page, "brandTechGlow")
    await page.goto("/brand/browse")
    // Seeded creators should appear in the directory.
    await expect(page.getByText(/emilydancez/i).first()).toBeVisible()
    await expect(page.getByText(/alextechreviews/i).first()).toBeVisible()
  })
})

test.describe("admin flow (read-only)", () => {
  test("admin can see the full users list", async ({ page }) => {
    await loginAs(page, "admin")
    await page.goto("/admin/users")
    // At least a handful of seeded roles should be visible.
    await expect(page.getByText(/brand@techglow\.com/i)).toBeVisible()
    await expect(page.getByText(/creator@emilydance\.com/i)).toBeVisible()
    await expect(page.getByText(/network@viralreach\.com/i)).toBeVisible()
  })

  test("admin can see the disputed ticket", async ({ page }) => {
    await loginAs(page, "admin")
    await page.goto("/admin/tickets")
    // Seed creates a dispute ticket on the supplement-stack-review order.
    await expect(
      page.getByText(/supplement stack review/i)
    ).toBeVisible()
  })
})
