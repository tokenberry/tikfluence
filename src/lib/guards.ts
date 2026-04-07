import type { UserRole } from "@prisma/client"

/**
 * Role-based guards for route handlers.
 *
 * These are pure functions — they take a resolved role/user identity and
 * return booleans. They do NOT read the session or touch the database; route
 * handlers are responsible for calling `auth()` and loading the order/brand
 * before delegating the authorisation decision here.
 */

export function isAdmin(role: UserRole | null | undefined): boolean {
  return role === "ADMIN"
}

export function isBrand(role: UserRole | null | undefined): boolean {
  return role === "BRAND"
}

export function isCreator(role: UserRole | null | undefined): boolean {
  return role === "CREATOR"
}

export function isNetwork(role: UserRole | null | undefined): boolean {
  return role === "NETWORK"
}

export function isAgency(role: UserRole | null | undefined): boolean {
  return role === "AGENCY"
}

export function isAccountManager(
  role: UserRole | null | undefined
): boolean {
  return role === "ACCOUNT_MANAGER"
}

export interface OrderViewContext {
  /** The user attempting to view the order. */
  userId: string
  role: UserRole | null | undefined
  /** userId of the brand that owns the order. */
  brandUserId: string
  /** userIds of the creators/networks assigned to this order. */
  assignedUserIds: readonly string[]
  /** Optional: userId of the agency that manages this order's brand. */
  agencyUserId?: string | null
  /** Optional: userIds of account managers assigned to the brand/agency. */
  accountManagerUserIds?: readonly string[]
}

/**
 * Returns true if the given user is allowed to view the order.
 *
 * Access rules (mirrors the inline logic in /api/orders/[id]/route.ts):
 *  - ADMIN can view any order.
 *  - The brand owner can view their own order.
 *  - A creator/network assigned to the order can view it.
 *  - The managing agency (if any) can view it.
 *  - An account manager assigned to the brand/agency can view it.
 */
export function canViewOrder(ctx: OrderViewContext): boolean {
  if (isAdmin(ctx.role)) return true
  if (ctx.userId === ctx.brandUserId) return true
  if (ctx.assignedUserIds.includes(ctx.userId)) return true
  if (ctx.agencyUserId && ctx.userId === ctx.agencyUserId) return true
  if (
    ctx.accountManagerUserIds &&
    ctx.accountManagerUserIds.includes(ctx.userId)
  ) {
    return true
  }
  return false
}

/**
 * Returns true if the role may approve or reject a delivered order.
 * Only the order's brand owner or an admin may review deliveries — this
 * helper only checks the role half of that rule; the caller must still
 * verify that a BRAND user actually owns the order in question.
 */
export function canReviewDeliveryAsRole(
  role: UserRole | null | undefined
): boolean {
  return isAdmin(role) || isBrand(role)
}
