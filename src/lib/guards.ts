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

// --- Order chat thread guards (F1) ---------------------------------------

export interface OrderThreadContext {
  /** The user attempting to read/write the order's chat thread. */
  userId: string
  role: UserRole | null | undefined
  /** userId of the brand that owns the order. */
  brandUserId: string
  /** Optional agency userId managing the order's brand. */
  agencyUserId?: string | null
  /** userIds of any account managers assigned to the brand/agency. */
  accountManagerUserIds?: readonly string[]
  /**
   * When set, restricts access to participants of this specific
   * OrderAssignment (one (order, creator) pair). A creator or network
   * passes their OWN assignment's userId here; brand-side roles pass
   * null to imply "any thread on this order".
   */
  assignmentUserIds?: readonly string[] | null
}

/**
 * Returns true if the given user may read or post messages in a given
 * order thread.
 *
 * Access rules:
 *  - ADMIN can always participate (support intervention).
 *  - The brand owner (userId === brandUserId) can participate in every
 *    thread on their own order.
 *  - The managing agency user (if any) can participate in every thread.
 *  - An account manager assigned to the brand/agency can participate.
 *  - A creator or network user may participate ONLY in threads for their
 *    own assignment (i.e. their userId must appear in assignmentUserIds).
 */
export function canAccessOrderThread(ctx: OrderThreadContext): boolean {
  if (isAdmin(ctx.role)) return true
  if (ctx.userId === ctx.brandUserId) return true
  if (ctx.agencyUserId && ctx.userId === ctx.agencyUserId) return true
  if (
    ctx.accountManagerUserIds &&
    ctx.accountManagerUserIds.includes(ctx.userId)
  ) {
    return true
  }
  if (
    ctx.assignmentUserIds &&
    ctx.assignmentUserIds.includes(ctx.userId)
  ) {
    return true
  }
  return false
}

// --- Pre-publish content draft guards (F2) --------------------------------

export interface ContentDraftContext {
  /** The user attempting the action. */
  userId: string
  role: UserRole | null | undefined
  /** userId of the brand that owns the order. */
  brandUserId: string
  /** userId of the creator who owns the assignment the draft belongs to. */
  assignmentCreatorUserId: string
  /** userId of the network the assignment rolls up to, if any. */
  assignmentNetworkUserId?: string | null
  /** Optional: userId of the agency that manages this order's brand. */
  agencyUserId?: string | null
  /** Optional: userIds of account managers assigned to the brand/agency. */
  accountManagerUserIds?: readonly string[]
}

/**
 * Returns true if the given user is allowed to upload a new content draft
 * against the specified assignment.
 *
 * Only the creator who owns the assignment (or the network that the
 * assignment rolls up to, acting on the creator's behalf) may upload drafts
 * — the brand side reviews, it does not produce drafts.
 */
export function canUploadContentDraft(ctx: ContentDraftContext): boolean {
  if (isCreator(ctx.role) && ctx.userId === ctx.assignmentCreatorUserId) {
    return true
  }
  if (
    isNetwork(ctx.role) &&
    ctx.assignmentNetworkUserId &&
    ctx.userId === ctx.assignmentNetworkUserId
  ) {
    return true
  }
  return false
}

/**
 * Returns true if the given user is allowed to review (approve or reject)
 * a content draft on the specified assignment.
 *
 * The review side mirrors `canViewOrder` minus the creator/network half:
 *  - ADMIN can review any draft.
 *  - The brand owner can review drafts on their own orders.
 *  - The managing agency (if any) can review drafts for orders it manages.
 *  - An account manager assigned to the brand/agency can review drafts.
 *
 * Creators and networks cannot review — they only upload.
 */
export function canReviewContentDraft(ctx: ContentDraftContext): boolean {
  if (isAdmin(ctx.role)) return true
  if (isBrand(ctx.role) && ctx.userId === ctx.brandUserId) return true
  if (
    isAgency(ctx.role) &&
    ctx.agencyUserId &&
    ctx.userId === ctx.agencyUserId
  ) {
    return true
  }
  if (
    isAccountManager(ctx.role) &&
    ctx.accountManagerUserIds &&
    ctx.accountManagerUserIds.includes(ctx.userId)
  ) {
    return true
  }
  return false
}

/**
 * Returns true if the given user is allowed to view (list / read) content
 * drafts on the specified assignment.
 *
 * View access is the union of upload and review access:
 *  - Anyone who can upload a draft for this assignment can view its drafts.
 *  - Anyone who can review a draft for this assignment can view them.
 */
export function canViewContentDrafts(ctx: ContentDraftContext): boolean {
  return canUploadContentDraft(ctx) || canReviewContentDraft(ctx)
}

// --- Physical product shipping guards (F3) --------------------------------

export interface ShippingContext {
  /** The user attempting the action. */
  userId: string
  role: UserRole | null | undefined
  /** userId of the brand that owns the order. */
  brandUserId: string
  /** userId of the creator who owns the assignment being shipped to. */
  assignmentCreatorUserId: string
  /** userId of the network the assignment rolls up to, if any. */
  assignmentNetworkUserId?: string | null
  /** Optional: userId of the agency that manages this order's brand. */
  agencyUserId?: string | null
  /** Optional: userIds of account managers assigned to the brand/agency. */
  accountManagerUserIds?: readonly string[]
}

/**
 * Returns true if the given user is allowed to manage the brand side of a
 * shipment (mark as shipped, update tracking, edit carrier notes).
 *
 * Rules mirror `canReviewContentDraft`:
 *  - ADMIN can always manage shipping (support intervention).
 *  - The brand owner can manage shipments on their own orders.
 *  - The managing agency (if any) can manage shipments for brands it manages.
 *  - An account manager assigned to the brand/agency can manage shipments.
 *
 * Creators and networks cannot manage — they only receive and confirm.
 */
export function canManageShipping(ctx: ShippingContext): boolean {
  if (isAdmin(ctx.role)) return true
  if (isBrand(ctx.role) && ctx.userId === ctx.brandUserId) return true
  if (
    isAgency(ctx.role) &&
    ctx.agencyUserId &&
    ctx.userId === ctx.agencyUserId
  ) {
    return true
  }
  if (
    isAccountManager(ctx.role) &&
    ctx.accountManagerUserIds &&
    ctx.accountManagerUserIds.includes(ctx.userId)
  ) {
    return true
  }
  return false
}

/**
 * Returns true if the given user is allowed to act on the receiving side of
 * a shipment: provide/confirm the shipping address, confirm delivery once
 * the package arrives, or report an issue (lost / damaged / wrong item).
 *
 * Only the creator who owns the assignment (or the network that the
 * assignment rolls up to, acting on the creator's behalf) may take these
 * actions — the brand side cannot confirm receipt on the creator's behalf.
 */
export function canReceiveShipment(ctx: ShippingContext): boolean {
  if (isCreator(ctx.role) && ctx.userId === ctx.assignmentCreatorUserId) {
    return true
  }
  if (
    isNetwork(ctx.role) &&
    ctx.assignmentNetworkUserId &&
    ctx.userId === ctx.assignmentNetworkUserId
  ) {
    return true
  }
  return false
}

/**
 * Returns true if the given user is allowed to view shipping state on the
 * specified assignment. The union of manage + receive access, mirroring how
 * `canViewContentDrafts` composes its two halves.
 */
export function canViewShipping(ctx: ShippingContext): boolean {
  return canManageShipping(ctx) || canReceiveShipment(ctx)
}
