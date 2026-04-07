import type { OrderStatus } from "@prisma/client"

/**
 * Order statuses a creator/network can submit a delivery against.
 * Kept here as the single source of truth for the deliverable state machine.
 */
export const DELIVERABLE_STATUSES: readonly OrderStatus[] = [
  "ASSIGNED",
  "IN_PROGRESS",
  "REVISION",
] as const

/**
 * Returns true if the given order status permits a creator to submit a new
 * delivery. Used by the /orders/[id]/deliver route to gate POSTs.
 */
export function canDeliverOrder(status: OrderStatus): boolean {
  return DELIVERABLE_STATUSES.includes(status)
}

/**
 * Returns true if the given order status permits a brand to approve or reject
 * the latest delivery. Only orders that have already been delivered may be
 * reviewed.
 */
export function canReviewDelivery(status: OrderStatus): boolean {
  return status === "DELIVERED"
}

/**
 * Returns true if the given order status may be cancelled. Draft/open orders
 * can be cancelled by the brand; anything past ASSIGNED requires admin.
 */
export function canCancelOrder(status: OrderStatus): boolean {
  return status === "DRAFT" || status === "OPEN"
}

export interface PayoutBreakdown {
  /** The per-creator share of the order budget (pre-fee). */
  perCreatorBudget: number
  /** Platform fee deducted from the per-creator share. */
  platformFee: number
  /** Net payout to the creator after the platform fee. */
  creatorPayout: number
}

/**
 * Computes the payout breakdown for a single creator approval.
 *
 * Orders may have multiple assignments (maxCreators > 1); the budget is split
 * evenly across the creators that have actually completed, plus the one
 * currently being approved. This mirrors the logic previously inlined in
 * /api/orders/[id]/approve and is exposed here as a pure function so it can
 * be unit-tested in isolation.
 *
 * @param budget total order budget in USD
 * @param feeRate platform fee rate in [0, 1] (e.g. 0.15 for 15%)
 * @param completedCount number of assignments already marked completed
 *                       (excluding the one currently being approved)
 */
export function calculateCreatorPayout(
  budget: number,
  feeRate: number,
  completedCount: number
): PayoutBreakdown {
  if (budget < 0) throw new Error("budget must be non-negative")
  if (feeRate < 0 || feeRate > 1) throw new Error("feeRate must be in [0, 1]")
  if (completedCount < 0 || !Number.isFinite(completedCount)) {
    throw new Error("completedCount must be a non-negative finite number")
  }

  const activeAssignments = Math.max(completedCount + 1, 1)
  const perCreatorBudget = budget / activeAssignments
  const platformFee = perCreatorBudget * feeRate
  const creatorPayout = perCreatorBudget - platformFee

  return { perCreatorBudget, platformFee, creatorPayout }
}
