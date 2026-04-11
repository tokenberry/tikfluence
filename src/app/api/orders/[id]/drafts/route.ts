import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { canUploadContentDraft } from "@/lib/guards"
import { createNotification } from "@/lib/notifications"
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { z } from "zod"

export const dynamic = "force-dynamic"

/**
 * Pre-publish content drafts — creators upload video/images so the brand
 * side can approve (or request changes) BEFORE they post to TikTok.
 *
 * Drafts are advisory only: they do NOT block delivery submission. The
 * purpose is to shorten revision cycles and avoid published-and-pulled
 * content. Drafts are scoped per OrderAssignment, mirroring the chat model
 * — on multi-creator orders each creator's drafts are private to them and
 * the brand side.
 */

interface OrderContext {
  brandUserId: string
  agencyUserId: string | null
  accountManagerUserIds: string[]
  assignments: Array<{
    id: string
    creatorUserId: string | null
    networkUserId: string | null
  }>
}

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

  const amAssignments = await prisma.accountManagerBrand.findMany({
    where: { brandId: order.brand.id },
    select: { accountManager: { select: { userId: true } } },
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
      creatorUserId: a.creator?.user?.id ?? null,
      networkUserId: a.network?.user?.id ?? null,
    })),
  }
}

/**
 * Which assignments can the caller see drafts for? Returns the set of
 * accessible assignment ids. Brand side (brand / agency / AM / admin) sees
 * every assignment on the order; creator/network only sees their own.
 */
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
    if (
      isBrandSide ||
      (a.creatorUserId && a.creatorUserId === userId) ||
      (a.networkUserId && a.networkUserId === userId)
    ) {
      visible.add(a.id)
    }
  }
  return visible
}

const listQuerySchema = z.object({
  assignmentId: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
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

    const visible = visibleAssignmentsFor(ctx, userId, role)
    if (visible.size === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    if (assignmentId && !visible.has(assignmentId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const drafts = await prisma.contentDraft.findMany({
      where: {
        orderId,
        assignmentId: assignmentId
          ? assignmentId
          : { in: Array.from(visible) },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        creatorUser: {
          select: { id: true, name: true, image: true, avatar: true },
        },
        reviewerUser: {
          select: { id: true, name: true, image: true, avatar: true },
        },
      },
    })

    return NextResponse.json({
      drafts,
      visibleAssignmentIds: Array.from(visible),
    })
  } catch (error) {
    console.error("Error listing content drafts:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

const postBodySchema = z.object({
  assignmentId: z.string().min(1),
  draftType: z.enum(["VIDEO", "IMAGES"]),
  fileUrls: z.array(z.string().url()).min(1).max(10),
  notes: z.string().max(2000).optional(),
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

    const rl = rateLimit(`order-draft:${session.user.id}`, RATE_LIMITS.api)
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many draft uploads, slow down." },
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
    const { assignmentId, draftType, fileUrls, notes } = parsed.data

    const assignment = ctx.assignments.find((a) => a.id === assignmentId)
    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found on this order" },
        { status: 404 }
      )
    }

    const userId = session.user.id
    const role = session.user.role

    const allowed = canUploadContentDraft({
      userId,
      role,
      brandUserId: ctx.brandUserId,
      assignmentCreatorUserId: assignment.creatorUserId ?? "",
      assignmentNetworkUserId: assignment.networkUserId,
      agencyUserId: ctx.agencyUserId,
      accountManagerUserIds: ctx.accountManagerUserIds,
    })
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const draft = await prisma.contentDraft.create({
      data: {
        orderId,
        assignmentId,
        creatorUserId: userId,
        draftType,
        fileUrls,
        notes: notes ?? null,
      },
      include: {
        creatorUser: {
          select: { id: true, name: true, image: true, avatar: true },
        },
      },
    })

    // Notify the brand-side recipients (brand / agency / account managers)
    // so they can review. Drafts do not notify other creators.
    const senderName = session.user.name ?? "A creator"
    const recipients = new Set<string>()
    recipients.add(ctx.brandUserId)
    if (ctx.agencyUserId) recipients.add(ctx.agencyUserId)
    for (const amId of ctx.accountManagerUserIds) recipients.add(amId)
    recipients.delete(userId)

    const recipientUsers = await prisma.user.findMany({
      where: { id: { in: Array.from(recipients) } },
      select: { id: true, role: true },
    })
    const roleByUserId = new Map(
      recipientUsers.map((u) => [u.id, u.role as string | null])
    )

    await Promise.allSettled(
      Array.from(recipients).map((recipientId) => {
        const recipientRole = roleByUserId.get(recipientId) ?? null
        const link = buildOrderDetailPath(recipientRole, orderId)
        return createNotification(
          recipientId,
          "content_draft_submitted",
          `New draft from ${senderName}`,
          `A ${draftType === "VIDEO" ? "video" : "image"} draft is awaiting your review.`,
          link
        )
      })
    )

    return NextResponse.json(draft, { status: 201 })
  } catch (error) {
    console.error("Error uploading content draft:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
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
