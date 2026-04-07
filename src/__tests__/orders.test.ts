import { describe, it, expect } from "vitest"
import {
  DELIVERABLE_STATUSES,
  calculateCreatorPayout,
  canCancelOrder,
  canDeliverOrder,
  canReviewDelivery,
} from "@/lib/orders"

describe("calculateCreatorPayout", () => {
  it("splits the full budget between a single creator minus platform fee", () => {
    const result = calculateCreatorPayout(100, 0.15, 0)
    expect(result.perCreatorBudget).toBe(100)
    expect(result.platformFee).toBeCloseTo(15, 10)
    expect(result.creatorPayout).toBeCloseTo(85, 10)
  })

  it("splits the budget evenly across multiple creators", () => {
    // 1 already completed, approving the 2nd → activeAssignments = 2
    const result = calculateCreatorPayout(200, 0.15, 1)
    expect(result.perCreatorBudget).toBe(100)
    expect(result.platformFee).toBeCloseTo(15, 10)
    expect(result.creatorPayout).toBeCloseTo(85, 10)
  })

  it("splits evenly across 4 creators", () => {
    const result = calculateCreatorPayout(400, 0.2, 3)
    expect(result.perCreatorBudget).toBe(100)
    expect(result.platformFee).toBeCloseTo(20, 10)
    expect(result.creatorPayout).toBeCloseTo(80, 10)
  })

  it("handles a zero fee rate", () => {
    const result = calculateCreatorPayout(100, 0, 0)
    expect(result.platformFee).toBe(0)
    expect(result.creatorPayout).toBe(100)
  })

  it("handles a 100% fee rate", () => {
    const result = calculateCreatorPayout(100, 1, 0)
    expect(result.platformFee).toBe(100)
    expect(result.creatorPayout).toBe(0)
  })

  it("handles a zero budget", () => {
    const result = calculateCreatorPayout(0, 0.15, 0)
    expect(result.perCreatorBudget).toBe(0)
    expect(result.platformFee).toBe(0)
    expect(result.creatorPayout).toBe(0)
  })

  it("payout + fee always sums to per-creator budget", () => {
    for (const [budget, fee, completed] of [
      [100, 0.15, 0],
      [250, 0.2, 2],
      [1000, 0.05, 4],
      [99.99, 0.15, 1],
    ] as const) {
      const r = calculateCreatorPayout(budget, fee, completed)
      expect(r.creatorPayout + r.platformFee).toBeCloseTo(r.perCreatorBudget, 10)
    }
  })

  it("rejects negative budgets", () => {
    expect(() => calculateCreatorPayout(-1, 0.15, 0)).toThrow()
  })

  it("rejects fee rates outside [0, 1]", () => {
    expect(() => calculateCreatorPayout(100, -0.1, 0)).toThrow()
    expect(() => calculateCreatorPayout(100, 1.5, 0)).toThrow()
  })

  it("rejects negative or infinite completedCount", () => {
    expect(() => calculateCreatorPayout(100, 0.15, -1)).toThrow()
    expect(() => calculateCreatorPayout(100, 0.15, Infinity)).toThrow()
  })
})

describe("canDeliverOrder", () => {
  it("allows delivery from ASSIGNED / IN_PROGRESS / REVISION", () => {
    expect(canDeliverOrder("ASSIGNED")).toBe(true)
    expect(canDeliverOrder("IN_PROGRESS")).toBe(true)
    expect(canDeliverOrder("REVISION")).toBe(true)
  })

  it("rejects delivery from other statuses", () => {
    expect(canDeliverOrder("DRAFT")).toBe(false)
    expect(canDeliverOrder("OPEN")).toBe(false)
    expect(canDeliverOrder("DELIVERED")).toBe(false)
    expect(canDeliverOrder("APPROVED")).toBe(false)
    expect(canDeliverOrder("COMPLETED")).toBe(false)
    expect(canDeliverOrder("DISPUTED")).toBe(false)
    expect(canDeliverOrder("CANCELLED")).toBe(false)
  })

  it("matches DELIVERABLE_STATUSES constant", () => {
    expect(DELIVERABLE_STATUSES).toEqual(["ASSIGNED", "IN_PROGRESS", "REVISION"])
  })
})

describe("canReviewDelivery", () => {
  it("only permits review of DELIVERED orders", () => {
    expect(canReviewDelivery("DELIVERED")).toBe(true)
    expect(canReviewDelivery("ASSIGNED")).toBe(false)
    expect(canReviewDelivery("IN_PROGRESS")).toBe(false)
    expect(canReviewDelivery("REVISION")).toBe(false)
    expect(canReviewDelivery("APPROVED")).toBe(false)
    expect(canReviewDelivery("COMPLETED")).toBe(false)
    expect(canReviewDelivery("DRAFT")).toBe(false)
  })
})

describe("canCancelOrder", () => {
  it("allows cancelling DRAFT and OPEN orders", () => {
    expect(canCancelOrder("DRAFT")).toBe(true)
    expect(canCancelOrder("OPEN")).toBe(true)
  })

  it("blocks cancelling anything past assignment", () => {
    expect(canCancelOrder("ASSIGNED")).toBe(false)
    expect(canCancelOrder("IN_PROGRESS")).toBe(false)
    expect(canCancelOrder("DELIVERED")).toBe(false)
    expect(canCancelOrder("COMPLETED")).toBe(false)
    expect(canCancelOrder("CANCELLED")).toBe(false)
  })
})
