import { test, expect } from "@playwright/test"
import { loginAs } from "./fixtures/auth"
import { resetMutableOrderState, disconnectPrisma } from "./fixtures/reset"

/**
 * Full order mutation flow:
 *
 *     brand creates DRAFT order
 *       → brand publishes (checkout in dev mode → OPEN)
 *         → creator accepts (ASSIGNED)
 *           → creator delivers (DELIVERED)
 *             → brand approves (COMPLETED + payout HELD/RELEASED)
 *
 * This spec drives the flow through the HTTP API rather than the UI
 * because (a) the new-order form uses translated labels that would make
 * selectors brittle, and (b) the state machine is what we actually want
 * to pin — the read-only dashboard tests in `authed.spec.ts` already
 * cover the visual layer for each role.
 *
 * Requires the same local-dev environment as the authed spec, PLUS that
 * the dev server's payment env vars are UNSET so the built-in dev-mode
 * fallbacks in `src/app/api/orders/[id]/checkout/route.ts` and
 * `src/lib/payoneer.ts` short-circuit external calls. See `e2e/README.md`.
 *
 *   # terminal 1
 *   npm run db:seed
 *   unset STRIPE_SECRET_KEY PAYONEER_PARTNER_ID PAYONEER_API_KEY RESEND_API_KEY
 *   npm run dev
 *
 *   # terminal 2
 *   E2E_AUTHED=1 BASE_URL=http://localhost:3000 npm run test:e2e
 */

test.describe.configure({ mode: "serial" })

test.describe("order mutation flow", () => {
  test.beforeAll(async () => {
    await resetMutableOrderState()
  })

  test.afterAll(async () => {
    await disconnectPrisma()
  })

  let categoryId: string
  let createdOrderId: string

  test("brand creates a DRAFT SHORT_VIDEO order", async ({ page }) => {
    await loginAs(page, "brandFitFuel")

    // Look up a category ID (categories are upserted by the seed).
    const categoriesRes = await page.request.get("/api/categories")
    expect(categoriesRes.ok()).toBeTruthy()
    const categoriesBody = (await categoriesRes.json()) as {
      categories: Array<{ id: string; slug: string }>
    }
    const food = categoriesBody.categories.find((c) => c.slug === "food")
    expect(food).toBeDefined()
    categoryId = food!.id

    const createRes = await page.request.post("/api/orders", {
      data: {
        title: "E2E Mutation Spec Order",
        description: "Automated end-to-end test order for the mutation spec.",
        brief: "Show a FitFuel protein shake in a morning routine. 30-60s.",
        categoryId,
        type: "SHORT_VIDEO",
        impressionTarget: 50000,
        budget: 500,
        maxCreators: 1,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      },
    })
    expect(createRes.status()).toBe(201)
    const created = (await createRes.json()) as { id: string; status: string }
    expect(created.status).toBe("DRAFT")
    createdOrderId = created.id
  })

  test("brand publishes the order (checkout → OPEN in dev mode)", async ({
    page,
  }) => {
    await loginAs(page, "brandFitFuel")

    const res = await page.request.post(
      `/api/orders/${createdOrderId}/checkout`
    )
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    // Dev mode fallback: STRIPE_SECRET_KEY is unset, so the route
    // publishes directly and returns `{ success: true, devMode: true }`.
    expect(body.success).toBe(true)
    expect(body.devMode).toBe(true)

    const orderRes = await page.request.get(`/api/orders/${createdOrderId}`)
    expect(orderRes.ok()).toBeTruthy()
    const order = await orderRes.json()
    expect(order.status).toBe("OPEN")
    expect(order.paymentStatus).toBe("HELD")
  })

  test("creator accepts the open order (OPEN → ASSIGNED)", async ({
    page,
  }) => {
    // Sofia supports SHORT_VIDEO by default, doesn't support LIVE.
    await loginAs(page, "creatorSofia")

    const acceptRes = await page.request.post(
      `/api/orders/${createdOrderId}/accept`
    )
    expect(acceptRes.status()).toBe(201)
    const assignment = await acceptRes.json()
    expect(assignment.status).toBe("ASSIGNED")

    const orderRes = await page.request.get(`/api/orders/${createdOrderId}`)
    const order = await orderRes.json()
    expect(order.status).toBe("ASSIGNED")
    expect(order.assignments).toHaveLength(1)
  })

  test("creator cannot re-accept the same order", async ({ page }) => {
    await loginAs(page, "creatorSofia")
    const res = await page.request.post(
      `/api/orders/${createdOrderId}/accept`
    )
    // Order is no longer OPEN, so accept returns 400 ("not open for
    // acceptance") — not a 409 — because the OPEN-status check fires
    // before the assignment-collision check.
    expect(res.status()).toBe(400)
  })

  test("creator delivers the assigned order (ASSIGNED → DELIVERED)", async ({
    page,
  }) => {
    await loginAs(page, "creatorSofia")

    const deliverRes = await page.request.post(
      `/api/orders/${createdOrderId}/deliver`,
      {
        data: {
          deliveryType: "SHORT_VIDEO",
          tiktokLink: "https://tiktok.com/@sofiacooks/video/e2e-mutation",
          tiktokLinks: [],
          screenshots: [],
          impressions: 62000,
          views: 58000,
          likes: 4200,
          comments: 180,
          shares: 320,
          notes: "Exceeded impression target.",
        },
      }
    )
    expect(deliverRes.status()).toBe(201)

    const orderRes = await page.request.get(`/api/orders/${createdOrderId}`)
    const order = await orderRes.json()
    expect(order.status).toBe("DELIVERED")
    expect(order.deliveries).toHaveLength(1)
    expect(order.deliveries[0].tiktokLink).toContain("e2e-mutation")
  })

  test("wrong brand cannot approve the delivery", async ({ page }) => {
    // Authorization check: only the brand that owns the order (or an
    // admin) can approve. brandTechGlow is not the owner — FitFuel is.
    await loginAs(page, "brandTechGlow")
    const res = await page.request.post(
      `/api/orders/${createdOrderId}/approve`,
      { data: { approved: true } }
    )
    expect(res.status()).toBe(403)
  })

  test("brand approves the delivery (DELIVERED → COMPLETED + transaction)", async ({
    page,
  }) => {
    await loginAs(page, "brandFitFuel")

    const approveRes = await page.request.post(
      `/api/orders/${createdOrderId}/approve`,
      { data: { approved: true } }
    )
    expect(approveRes.ok()).toBeTruthy()

    const orderRes = await page.request.get(`/api/orders/${createdOrderId}`)
    const order = await orderRes.json()
    expect(order.status).toBe("COMPLETED")
    // Payoneer is in dev mode (no keys set) so the payout is not released
    // automatically; the transaction remains HELD/PENDING. The order
    // paymentStatus stays HELD until a real payout lands.
    expect(order.paymentStatus).toBe("HELD")

    // Exactly one transaction should have been created for this order.
    expect(order.transactions).toHaveLength(1)
    const tx = order.transactions[0]
    // Payout math: single creator, default platform fee (15%) on $500.
    expect(tx.amount).toBeCloseTo(500, 2)
    expect(tx.platformFee).toBeCloseTo(75, 2)
    expect(tx.creatorPayout).toBeCloseTo(425, 2)
  })

  test("brand cannot re-approve a completed order", async ({ page }) => {
    await loginAs(page, "brandFitFuel")
    const res = await page.request.post(
      `/api/orders/${createdOrderId}/approve`,
      { data: { approved: true } }
    )
    // canReviewDelivery() returns false for COMPLETED — the approve
    // route returns 400 "Order has not been delivered yet".
    expect(res.status()).toBe(400)
  })
})

test.describe("order rejection flow", () => {
  test.beforeAll(async () => {
    await resetMutableOrderState()
  })

  test.afterAll(async () => {
    await disconnectPrisma()
  })

  let rejectionOrderId: string

  test("full flow up to DELIVERED, then brand requests revision", async ({
    page,
  }) => {
    // Condensed setup — this spec just verifies the rejection branch
    // of the approve route (DELIVERED → REVISION, not COMPLETED).
    await loginAs(page, "brandFitFuel")

    const categoriesRes = await page.request.get("/api/categories")
    const categoriesBody = (await categoriesRes.json()) as {
      categories: Array<{ id: string; slug: string }>
    }
    const categoryId = categoriesBody.categories.find(
      (c) => c.slug === "food"
    )!.id

    const createRes = await page.request.post("/api/orders", {
      data: {
        title: "E2E Rejection Spec Order",
        description: "Automated rejection test.",
        categoryId,
        type: "SHORT_VIDEO",
        impressionTarget: 20000,
        budget: 200,
        maxCreators: 1,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      },
    })
    rejectionOrderId = (await createRes.json()).id

    await page.request.post(`/api/orders/${rejectionOrderId}/checkout`)

    await loginAs(page, "creatorSofia")
    await page.request.post(`/api/orders/${rejectionOrderId}/accept`)
    await page.request.post(`/api/orders/${rejectionOrderId}/deliver`, {
      data: {
        deliveryType: "SHORT_VIDEO",
        tiktokLink:
          "https://tiktok.com/@sofiacooks/video/e2e-rejection",
        tiktokLinks: [],
        screenshots: [],
        impressions: 5000,
        views: 4500,
        likes: 200,
        comments: 20,
        shares: 10,
        notes: "First attempt.",
      },
    })

    await loginAs(page, "brandFitFuel")
    const rejectRes = await page.request.post(
      `/api/orders/${rejectionOrderId}/approve`,
      {
        data: {
          approved: false,
          rejectionReason: "Please re-shoot with better lighting.",
        },
      }
    )
    expect(rejectRes.ok()).toBeTruthy()

    const orderRes = await page.request.get(
      `/api/orders/${rejectionOrderId}`
    )
    const order = await orderRes.json()
    expect(order.status).toBe("REVISION")
    expect(order.deliveries[0].approved).toBe(false)
    expect(order.deliveries[0].rejectionReason).toContain(
      "better lighting"
    )
  })

  test("creator can submit a second delivery after revision", async ({
    page,
  }) => {
    await loginAs(page, "creatorSofia")
    const redeliverRes = await page.request.post(
      `/api/orders/${rejectionOrderId}/deliver`,
      {
        data: {
          deliveryType: "SHORT_VIDEO",
          tiktokLink:
            "https://tiktok.com/@sofiacooks/video/e2e-rejection-v2",
          tiktokLinks: [],
          screenshots: [],
          impressions: 45000,
          views: 42000,
          likes: 3100,
          comments: 140,
          shares: 220,
          notes: "Reshot with better lighting.",
        },
      }
    )
    expect(redeliverRes.status()).toBe(201)

    const orderRes = await page.request.get(
      `/api/orders/${rejectionOrderId}`
    )
    const order = await orderRes.json()
    expect(order.status).toBe("DELIVERED")
    expect(order.deliveries).toHaveLength(2)
  })
})

