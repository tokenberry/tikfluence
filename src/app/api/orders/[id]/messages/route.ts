import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { canAccessOrderThread } from "@/lib/guards"
import { createNotification } from "@/lib/notifications"
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { z } from "zod"

export const dynamic = "force-dynamic"

/**
 * Threaded chat between the assigned creator(s) and the order placer
 * (brand / agency / account-manager) — scoped per OrderAssignment so that
 * multi-creator orders get private threads.
 */

interface OrderContext {
  brandUserId: string
  agencyUserId: string | null
  accountManagerUserIds: string[]
  /** Map of assignmentId -> list of participating creator/network userIds */
  assignments: Array<{
    id: string
    userIds: string[]
  }>
}

/**
 * Load the order + all privilege-relevant context needed by
 * canAccessOrderThread for both the caller and any other participants.
 * Shared between GET + POST.
 */
async function loadOrderContext(orderId: string): Promise<OrderContext | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      brand: { select: { id: true, userId: true } },
      agency: { select: { userId: true } },
      assignments: {
        select: {
          id: true,
          creator: { select: { user: { select: { id: true } } } },
          network: { select: { user: { select: { id: true } } } },
        },
      },
    },
  })

  if (!order) return null

  // Account managers assigned to this order's brand OR managing agency
  const amAssignments = await prisma.accountManagerBrand.findMany({
    where: { brandId: order.brand.id },
    select: {
      accountManager: { select: { userId: true } },
    },
  })
  let amUserIds = amAssignments
    .map((a) => a.accountManager?.userId)
    .filter((x): x is string => typeof x === "string")

  if (order.agency) {
    const agencyAm = await prisma.accountManagerAgency.findMany({
      where: { agency: { userId: order.agency.userId } },
      select: { accountManager: { select: { userId: true } } },
    })
    amUserIds = [
      ...amUserIds,
      ...agencyAm
        .map((a) => a.accountManager?.userId)
        .filter((x): x is string => typeof x === "string"),
    ]
  }

  return {
    brandUserId: order.brand.userId,
    agencyUserId: order.agency?.userId ?? null,
    accountManagerUserIds: Array.from(new Set(amUserIds)),
    assignments: order.assignments.map((a) => ({
      id: a.id,
      userIds: [a.creator?.user?.id, a.network?.user?.id].filter(
        (x): x is string => typeof x === "string"
      ),
    })),
  }
}

/** Which assignments can the caller access, given the full order context? */
function visibleAssignmentsFor(
  ctx: OrderContext,
  userId: string,
  role: string | null | undefined
): Set<string> {
  const visible = new Set<string>()
  const isBrandSide =
    role === "ADMIN" ||
    userId === ctx.brandUserId ||
    (ctx.agencyUserId && userId === ctx.agencyUserId) ||
    ctx.accountManagerUserIds.includes(userId)

  for (const a of ctx.assignments) {
    if (isBrandSide || a.userIds.includes(userId)) {
      visible.add(a.id)
    }
  }
  return visible
}

const listQuerySchema = z.object({
  assignmentId: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: orderId } = await params

    const ctx = await loadOrderContext(orderId)
    if (!ctx) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const parsed = listQuerySchema.safeParse({
      assignmentId: searchParams.get("assignmentId") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    })
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query", details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { assignmentId, limit } = parsed.data

    const userId = session.user.id
    const role = session.user.role

    // What assignments is the caller allowed to see messages for?
    const visible = visibleAssignmentsFor(ctx, userId, role)
    if (visible.size === 0) {
      // No legitimate participation on this order at all.
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // If a specific assignment was requested, verify access to it.
    if (assignmentId && !visible.has(assignmentId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const messages = await prisma.orderMessage.findMany({
      where: {
        orderId,
        assignmentId: assignmentId
          ? assignmentId
          : { in: Array.from(visible) },
      },
      orderBy: { createdAt: "asc" },
      take: limit,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            avatar: true,
            role: true,
          },
        },
      },
    })

    return NextResponse.json({
      messages,
      visibleAssignmentIds: Array.from(visible),
    })
  } catch (error) {
    console.error("Error listing order messages:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

const postBodySchema = z.object({
  assignmentId: z.string().min(1),
  body: z.string().min(1).max(2000),
  attachments: z.array(z.string().url()).max(5).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rl = rateLimit(`order-msg:${session.user.id}`, RATE_LIMITS.api)
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many messages, slow down." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      )
    }

    const { id: orderId } = await params
    const ctx = await loadOrderContext(orderId)
    if (!ctx) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const json = await request.json()
    const parsed = postBodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { assignmentId, body, attachments = [] } = parsed.data

    // Verify the assignment belongs to this order
    const assignment = ctx.assignments.find((a) => a.id === assignmentId)
    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found on this order" },
        { status: 404 }
      )
    }

    const userId = session.user.id
    const role = session.user.role

    const allowed = canAccessOrderThread({
      userId,
      role,
      brandUserId: ctx.brandUserId,
      agencyUserId: ctx.agencyUserId,
      accountManagerUserIds: ctx.accountManagerUserIds,
      assignmentUserIds: assignment.userIds,
    })
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const message = await prisma.orderMessage.create({
      data: {
        orderId,
        assignmentId,
        senderId: userId,
        body,
        attachments,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            avatar: true,
            role: true,
          },
        },
      },
    })

    // Notify every other participant on this thread.
    const senderName = session.user.name ?? "Someone"
    const recipients = new Set<string>()
    // Brand side (always part of the thread)
    recipients.add(ctx.brandUserId)
    if (ctx.agencyUserId) recipients.add(ctx.agencyUserId)
    for (const amId of ctx.accountManagerUserIds) recipients.add(amId)
    // Creator / network side for this assignment
    for (const participantId of assignment.userIds) recipients.add(participantId)
    // Don't notify self
    recipients.delete(userId)

    // Look up each recipient's role so we can route them to their own
    // role-specific order detail page.
    const recipientUsers = await prisma.user.findMany({
      where: { id: { in: Array.from(recipients) } },
      select: { id: true, role: true },
    })
    const roleByUserId = new Map(
      recipientUsers.map((u) => [u.id, u.role as string | null])
    )

    // Fire-and-forget notifications — don't block the response.
    await Promise.allSettled(
      Array.from(recipients).map((recipientId) => {
        const recipientRole = roleByUserId.get(recipientId) ?? null
        const link = buildOrderDetailPath(recipientRole, orderId)
        return createNotification(
          recipientId,
          "order_message_received",
          `New message from ${senderName}`,
          body.length > 120 ? `${body.slice(0, 117)}...` : body,
          link
        )
      })
    )

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error("Error posting order message:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * Build a role-appropriate URL for the notification link. Order detail
 * pages live under /brand/orders, /agency/orders, /creator/orders, etc.
 * Account managers don't have a dedicated order-detail route yet, so we
 * route them to their orders list page.
 */
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
