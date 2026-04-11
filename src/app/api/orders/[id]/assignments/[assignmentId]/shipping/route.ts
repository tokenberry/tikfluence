import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { canManageShipping, canReceiveShipment } from "@/lib/guards"
import { createNotification } from "@/lib/notifications"
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { z } from "zod"

export const dynamic = "force-dynamic"

/**
 * Per-assignment shipping state machine (F3).
 *
 * Orders with `requiresShipping === true` need the brand to ship a physical
 * product to the creator before content can be produced. Each
 * OrderAssignment carries its own `shippingStatus`, address snapshot, and
 * tracking — multi-creator orders ship in parallel without blocking each
 * other.
 *
 * All transitions are POST-based and action-typed so the route stays
 * ergonomic from a single client panel:
 *   - action="set_address"    (creator/network) → PENDING_SHIPMENT
 *   - action="mark_shipped"   (brand side)      → SHIPPED
 *   - action="confirm_delivery" (creator/network) → DELIVERED
 *   - action="report_issue"   (creator/network) → ISSUE_REPORTED
 *
 * GET returns the full shipping state for the assignment for any party who
 * can view it (manage or receive).
 */

interface AssignmentContext {
  orderId: string
  assignmentId: string
  brandUserId: string
  agencyUserId: string | null
  accountManagerUserIds: string[]
  assignmentCreatorUserId: string | null
  assignmentNetworkUserId: string | null
  requiresShipping: boolean
  shippingStatus: string
  currentSnapshot: {
    shipAddressName: string | null
    shipAddressLine1: string | null
    shipAddressLine2: string | null
    shipAddressCity: string | null
    shipAddressState: string | null
    shipAddressPostal: string | null
    shipAddressCountry: string | null
    shipAddressPhone: string | null
    shippingCarrier: string | null
    shippingTracking: string | null
    shippingTrackingUrl: string | null
    shippedAt: Date | null
    deliveredAt: Date | null
    shippingNotes: string | null
    shippingIssue: string | null
  }
}

async function loadAssignmentContext(
  orderId: string,
  assignmentId: string
): Promise<AssignmentContext | null> {
  const assignment = await prisma.orderAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      creator: { select: { user: { select: { id: true } } } },
      network: { select: { user: { select: { id: true } } } },
      order: {
        include: {
          brand: { select: { id: true, userId: true } },
          agency: { select: { userId: true } },
        },
      },
    },
  })
  if (!assignment || assignment.orderId !== orderId) return null

  const amBrand = await prisma.accountManagerBrand.findMany({
    where: { brandId: assignment.order.brand.id },
    select: { accountManager: { select: { userId: true } } },
  })
  let amUserIds = amBrand
    .map((a) => a.accountManager?.userId)
    .filter((x): x is string => typeof x === "string")
  if (assignment.order.agency) {
    const amAgency = await prisma.accountManagerAgency.findMany({
      where: { agency: { userId: assignment.order.agency.userId } },
      select: { accountManager: { select: { userId: true } } },
    })
    amUserIds = [
      ...amUserIds,
      ...amAgency
        .map((a) => a.accountManager?.userId)
        .filter((x): x is string => typeof x === "string"),
    ]
  }

  return {
    orderId: assignment.orderId,
    assignmentId: assignment.id,
    brandUserId: assignment.order.brand.userId,
    agencyUserId: assignment.order.agency?.userId ?? null,
    accountManagerUserIds: Array.from(new Set(amUserIds)),
    assignmentCreatorUserId: assignment.creator?.user?.id ?? null,
    assignmentNetworkUserId: assignment.network?.user?.id ?? null,
    requiresShipping: assignment.order.requiresShipping,
    shippingStatus: assignment.shippingStatus,
    currentSnapshot: {
      shipAddressName: assignment.shipAddressName,
      shipAddressLine1: assignment.shipAddressLine1,
      shipAddressLine2: assignment.shipAddressLine2,
      shipAddressCity: assignment.shipAddressCity,
      shipAddressState: assignment.shipAddressState,
      shipAddressPostal: assignment.shipAddressPostal,
      shipAddressCountry: assignment.shipAddressCountry,
      shipAddressPhone: assignment.shipAddressPhone,
      shippingCarrier: assignment.shippingCarrier,
      shippingTracking: assignment.shippingTracking,
      shippingTrackingUrl: assignment.shippingTrackingUrl,
      shippedAt: assignment.shippedAt,
      deliveredAt: assignment.deliveredAt,
      shippingNotes: assignment.shippingNotes,
      shippingIssue: assignment.shippingIssue,
    },
  }
}

function buildOrderDetailPath(
  role: string | null | undefined,
  orderId: string
): string {
  switch (role) {
    case "CREATOR":
      return `/creator/orders/${orderId}`
    case "NETWORK":
      return `/network/orders/${orderId}`
    case "AGENCY":
      return `/agency/orders/${orderId}`
    case "ADMIN":
      return `/admin/orders/${orderId}`
    case "ACCOUNT_MANAGER":
      return `/account-manager/orders`
    default:
      return `/brand/orders/${orderId}`
  }
}

async function notifyBrandSide(
  ctx: AssignmentContext,
  type: string,
  title: string,
  message: string
) {
  const recipients = new Set<string>()
  recipients.add(ctx.brandUserId)
  if (ctx.agencyUserId) recipients.add(ctx.agencyUserId)
  for (const amId of ctx.accountManagerUserIds) recipients.add(amId)

  const recipientUsers = await prisma.user.findMany({
    where: { id: { in: Array.from(recipients) } },
    select: { id: true, role: true },
  })
  const roleByUserId = new Map(
    recipientUsers.map((u) => [u.id, u.role as string | null])
  )

  await Promise.allSettled(
    Array.from(recipients).map((recipientId) => {
      const link = buildOrderDetailPath(
        roleByUserId.get(recipientId) ?? null,
        ctx.orderId
      )
      return createNotification(recipientId, type, title, message, link)
    })
  )
}

async function notifyReceiver(
  ctx: AssignmentContext,
  type: string,
  title: string,
  message: string
) {
  const recipients = new Set<string>()
  if (ctx.assignmentCreatorUserId) recipients.add(ctx.assignmentCreatorUserId)
  if (ctx.assignmentNetworkUserId) recipients.add(ctx.assignmentNetworkUserId)
  if (recipients.size === 0) return

  const recipientUsers = await prisma.user.findMany({
    where: { id: { in: Array.from(recipients) } },
    select: { id: true, role: true },
  })
  const roleByUserId = new Map(
    recipientUsers.map((u) => [u.id, u.role as string | null])
  )

  await Promise.allSettled(
    Array.from(recipients).map((recipientId) =>
      createNotification(
        recipientId,
        type,
        title,
        message,
        buildOrderDetailPath(roleByUserId.get(recipientId) ?? null, ctx.orderId)
      )
    )
  )
}

// ── GET ────────────────────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id: orderId, assignmentId } = await params

    const ctx = await loadAssignmentContext(orderId, assignmentId)
    if (!ctx) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      )
    }

    const shippingCtx = {
      userId: session.user.id,
      role: session.user.role,
      brandUserId: ctx.brandUserId,
      assignmentCreatorUserId: ctx.assignmentCreatorUserId ?? "",
      assignmentNetworkUserId: ctx.assignmentNetworkUserId,
      agencyUserId: ctx.agencyUserId,
      accountManagerUserIds: ctx.accountManagerUserIds,
    }
    const allowed =
      canManageShipping(shippingCtx) || canReceiveShipment(shippingCtx)
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({
      orderId: ctx.orderId,
      assignmentId: ctx.assignmentId,
      requiresShipping: ctx.requiresShipping,
      shippingStatus: ctx.shippingStatus,
      ...ctx.currentSnapshot,
    })
  } catch (error) {
    console.error("Error fetching shipping state:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// ── POST (action-based state transitions) ─────────────────────────────

const setAddressSchema = z.object({
  action: z.literal("set_address"),
  fullName: z.string().min(1).max(120),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional().nullable(),
  city: z.string().min(1).max(100),
  state: z.string().max(100).optional().nullable(),
  postalCode: z.string().min(1).max(20),
  country: z
    .string()
    .length(2)
    .regex(/^[A-Za-z]{2}$/),
  phone: z.string().max(40).optional().nullable(),
})

const markShippedSchema = z.object({
  action: z.literal("mark_shipped"),
  carrier: z.string().min(1).max(80),
  tracking: z.string().min(1).max(200),
  trackingUrl: z.string().url().max(500).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
})

const confirmDeliverySchema = z.object({
  action: z.literal("confirm_delivery"),
  notes: z.string().max(2000).optional().nullable(),
})

const reportIssueSchema = z.object({
  action: z.literal("report_issue"),
  issue: z.string().min(1).max(2000),
})

const actionSchema = z.discriminatedUnion("action", [
  setAddressSchema,
  markShippedSchema,
  confirmDeliverySchema,
  reportIssueSchema,
])

export async function POST(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id
    const role = session.user.role

    const { id: orderId, assignmentId } = await params

    const { success: allowed } = rateLimit(
      `shipping:${userId}`,
      RATE_LIMITS.api
    )
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      )
    }

    const body = await request.json()
    const parsed = actionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const ctx = await loadAssignmentContext(orderId, assignmentId)
    if (!ctx) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      )
    }
    if (!ctx.requiresShipping) {
      return NextResponse.json(
        { error: "Order does not require shipping" },
        { status: 400 }
      )
    }

    const shippingCtx = {
      userId,
      role,
      brandUserId: ctx.brandUserId,
      assignmentCreatorUserId: ctx.assignmentCreatorUserId ?? "",
      assignmentNetworkUserId: ctx.assignmentNetworkUserId,
      agencyUserId: ctx.agencyUserId,
      accountManagerUserIds: ctx.accountManagerUserIds,
    }

    const action = parsed.data.action
    const now = new Date()

    // ── set_address (creator/network → PENDING_SHIPMENT) ──
    if (action === "set_address") {
      if (!canReceiveShipment(shippingCtx)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      if (
        ctx.shippingStatus !== "NOT_REQUIRED" &&
        ctx.shippingStatus !== "PENDING_ADDRESS" &&
        ctx.shippingStatus !== "PENDING_SHIPMENT"
      ) {
        return NextResponse.json(
          {
            error: "Cannot change address after shipment has started",
            status: ctx.shippingStatus,
          },
          { status: 409 }
        )
      }

      const {
        fullName,
        line1,
        line2,
        city,
        state,
        postalCode,
        country,
        phone,
      } = parsed.data

      const updated = await prisma.orderAssignment.update({
        where: { id: assignmentId },
        data: {
          shippingStatus: "PENDING_SHIPMENT",
          shipAddressName: fullName,
          shipAddressLine1: line1,
          shipAddressLine2: line2 ?? null,
          shipAddressCity: city,
          shipAddressState: state ?? null,
          shipAddressPostal: postalCode,
          shipAddressCountry: country.toUpperCase(),
          shipAddressPhone: phone ?? null,
        },
      })

      await notifyBrandSide(
        ctx,
        "shipping_address_set",
        "Creator confirmed shipping address",
        `${fullName} is ready to receive your shipment in ${city}, ${country.toUpperCase()}.`
      )

      return NextResponse.json({ ok: true, assignment: updated })
    }

    // ── mark_shipped (brand side → SHIPPED) ──
    if (action === "mark_shipped") {
      if (!canManageShipping(shippingCtx)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      if (ctx.shippingStatus !== "PENDING_SHIPMENT") {
        return NextResponse.json(
          {
            error:
              "Cannot mark shipped until the creator has provided an address",
            status: ctx.shippingStatus,
          },
          { status: 409 }
        )
      }

      const { carrier, tracking, trackingUrl, notes } = parsed.data

      const updated = await prisma.orderAssignment.update({
        where: { id: assignmentId },
        data: {
          shippingStatus: "SHIPPED",
          shippingCarrier: carrier,
          shippingTracking: tracking,
          shippingTrackingUrl: trackingUrl ?? null,
          shippingNotes: notes ?? null,
          shippedAt: now,
        },
      })

      await notifyReceiver(
        ctx,
        "shipping_shipped",
        "Your package is on the way",
        `${carrier} tracking ${tracking}. Confirm delivery once it arrives.`
      )

      return NextResponse.json({ ok: true, assignment: updated })
    }

    // ── confirm_delivery (receiver → DELIVERED) ──
    if (action === "confirm_delivery") {
      if (!canReceiveShipment(shippingCtx)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      if (ctx.shippingStatus !== "SHIPPED") {
        return NextResponse.json(
          {
            error: "Shipment is not in a state that can be confirmed",
            status: ctx.shippingStatus,
          },
          { status: 409 }
        )
      }

      const updated = await prisma.orderAssignment.update({
        where: { id: assignmentId },
        data: {
          shippingStatus: "DELIVERED",
          deliveredAt: now,
          shippingNotes: parsed.data.notes ?? ctx.currentSnapshot.shippingNotes,
        },
      })

      await notifyBrandSide(
        ctx,
        "shipping_delivered",
        "Creator received the package",
        "The creator has confirmed delivery. Content production can begin."
      )

      return NextResponse.json({ ok: true, assignment: updated })
    }

    // ── report_issue (receiver → ISSUE_REPORTED) ──
    if (action === "report_issue") {
      if (!canReceiveShipment(shippingCtx)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      // Issues can be reported from SHIPPED (lost / damaged on arrival) or
      // from PENDING_SHIPMENT (brand sent the wrong item / refuses to ship).
      if (
        ctx.shippingStatus !== "SHIPPED" &&
        ctx.shippingStatus !== "PENDING_SHIPMENT" &&
        ctx.shippingStatus !== "DELIVERED"
      ) {
        return NextResponse.json(
          {
            error: "Cannot report an issue in the current state",
            status: ctx.shippingStatus,
          },
          { status: 409 }
        )
      }

      const updated = await prisma.orderAssignment.update({
        where: { id: assignmentId },
        data: {
          shippingStatus: "ISSUE_REPORTED",
          shippingIssue: parsed.data.issue,
        },
      })

      await notifyBrandSide(
        ctx,
        "shipping_issue",
        "Creator reported a shipping issue",
        parsed.data.issue.slice(0, 180)
      )

      return NextResponse.json({ ok: true, assignment: updated })
    }

    // Exhaustiveness check — z.discriminatedUnion should have caught this.
    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (error) {
    console.error("Error updating shipping state:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
