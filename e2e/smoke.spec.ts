import { test, expect } from "@playwright/test"

/**
 * Smoke tests for the Foxolog landing + legal surfaces.
 *
 * The most important test in this file is `landing footer exposes ToS + Privacy
 * links` — it locks in the v3.0.1 fix for the TikTok app review rejection
 * (rejection note: "ToS needs to be easily accessible from the homepage. Missing
 * Privacy Policy, PP needs to be easily accessible from the homepage."). If
 * these links ever silently disappear from the landing footer again, this test
 * fails before the next TikTok submission.
 *
 * See playwright.config.ts for BASE_URL configuration.
 */

test.describe("landing", () => {
  test("loads and renders the hero", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveTitle(/foxolog/i)
    // Hero CTA buttons are present
    await expect(page.getByRole("link", { name: /get started|brand|creator/i }).first()).toBeVisible()
  })

  test("footer exposes ToS + Privacy links (TikTok review compliance)", async ({ page }) => {
    await page.goto("/")
    // Scroll the footer into view (the page is long).
    await page.locator("footer").scrollIntoViewIfNeeded()

    const footer = page.locator("footer")
    await expect(footer).toBeVisible()

    // Both legal links must exist in the footer and point at the right routes.
    const termsLink = footer.locator('a[href$="/terms"]')
    const privacyLink = footer.locator('a[href$="/privacy"]')

    await expect(termsLink).toBeVisible()
    await expect(privacyLink).toBeVisible()
  })

  test("clicking footer Terms link navigates to /terms", async ({ page }) => {
    await page.goto("/")
    await page.locator("footer").scrollIntoViewIfNeeded()
    await page.locator('footer a[href$="/terms"]').first().click()
    await expect(page).toHaveURL(/\/terms\/?$/)
    await expect(page.getByRole("heading", { name: /terms of service/i })).toBeVisible()
  })

  test("clicking footer Privacy link navigates to /privacy", async ({ page }) => {
    await page.goto("/")
    await page.locator("footer").scrollIntoViewIfNeeded()
    await page.locator('footer a[href$="/privacy"]').first().click()
    await expect(page).toHaveURL(/\/privacy\/?$/)
    await expect(page.getByRole("heading", { name: /privacy policy/i })).toBeVisible()
  })
})

test.describe("legal pages", () => {
  test("/terms loads with the Terms of Service heading", async ({ page }) => {
    await page.goto("/terms")
    await expect(page).toHaveTitle(/terms of service/i)
    await expect(page.getByRole("heading", { name: /terms of service/i })).toBeVisible()
  })

  test("/privacy loads with the Privacy Policy heading", async ({ page }) => {
    await page.goto("/privacy")
    await expect(page).toHaveTitle(/privacy policy/i)
    await expect(page.getByRole("heading", { name: /privacy policy/i })).toBeVisible()
  })
})

test.describe("auth pages", () => {
  test("/login renders and exposes Terms + Privacy links", async ({ page }) => {
    await page.goto("/login")
    // Auth pages also link to the legal pages (added in v3.0.1)
    await expect(page.locator('a[href$="/terms"]')).toBeVisible()
    await expect(page.locator('a[href$="/privacy"]')).toBeVisible()
  })

  test("/register renders and exposes Terms + Privacy links", async ({ page }) => {
    await page.goto("/register")
    await expect(page.locator('a[href$="/terms"]')).toBeVisible()
    await expect(page.locator('a[href$="/privacy"]')).toBeVisible()
  })
})
