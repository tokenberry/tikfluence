import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { canInviteCreator } from "@/lib/guards"
import { createNotification } from "@/lib/notifications"
import { sendInvitationSentEmail } from "@/lib/email"
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { z } from "zod"

export const dynamic = "force-dynamic"

/**
 * `POST /api/orders/[id]/invitations/batch` — F4 completion (v4.0.1).
 *
 * Invites multiple creators to an order in a single request. Lets brands
 * click "Invite top N" from the `CreatorMatchList` instead of POSTing
 * one-at-a-time to `/api/orders/[id]/invitations`.
 *
 * Per-creator behavior mirrors the single-invite endpoint:
 * - upserts the invitation so a previously WITHDRAWN/DECLINED row
 *   reopens to PENDING instead of failing on the unique constraint,
 * - skips creators already assigned to the order (returned in `skipped`),
 * - skips creators whose user account is inactive,
 * - fires in-app + email notifications to each successfully-invited
 *   creator.
 *
 * Returns `{ invited: N, skipped: [{ creatorId, reason }] }`.
 */

const BATCH_MAX = 25

const postBodySchema = z.object({
  creatorIds: z.array(z.string().min(1)).min(1).max(BATCH_MAX),
  message: z.string().max(1000).optional(),
})

type SkipReason =
  | "CREATOR_NOT_FOUND"
  | "CREATOR_INACTIVE"
  | "ALREADY_ASSIGNED"

interface SkipRow {
  creatorId: string
  reason: SkipReason
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rl = rateLimit(
      `order-invite-batch:${session.user.id}`,
      RATE_LIMITS.api
    )
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many batch invites, slow down." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      )
    }

    const { id: orderId } = await params
    const json = await request.json()
    const parsed = postBodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { creatorIds, message } = parsed.data
    const uniqueIds = Array.from(new Set(creatorIds))

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        brand: { select: { id: true, userId: true, companyName: true } },
        agency: { select: { userId: true } },
      },
    })
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Load account managers for the brand + managing agency (matches
    // the per-order single-invite endpoint).
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

    const allowed = canInviteCreator({
      userId: session.user.id,
      role: session.user.role,
      brandUserId: order.brand.userId,
      agencyUserId: order.agency?.userId ?? null,
      accountManagerUserIds: Array.from(new Set(amUserIds)),
    })
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (order.status === "COMPLETED" || order.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Cannot invite creators to a completed or cancelled order." },
        { status: 409 }
      )
    }

    // Load all candidates + existing assignments in two batched queries.
    const creators = await prisma.creator.findMany({
      where: { id: { in: uniqueIds } },
      select: {
        id: true,
        tiktokUsername: true,
        user: {
          select: { id: true, name: true, email: true, isActive: true },
        },
      },
    })
    const creatorById = new Map(creators.map((c) => [c.id, c]))

    const existingAssignments = await prisma.orderAssignment.findMany({
      where: { orderId, creatorId: { in: uniqueIds } },
      select: { creatorId: true },
    })
    const assignedIds = new Set(existingAssignments.map((a) => a.creatorId))

    const skipped: SkipRow[] = []
    const invitable: typeof creators = []
    for (const creatorId of uniqueIds) {
      const c = creatorById.get(creatorId)
      if (!c) {
        skipped.push({ creatorId, reason: "CREATOR_NOT_FOUND" })
        continue
      }
      if (!c.user.isActive) {
        skipped.push({ creatorId, reason: "CREATOR_INACTIVE" })
        continue
      }
      if (assignedIds.has(creatorId)) {
        skipped.push({ creatorId, reason: "ALREADY_ASSIGNED" })
        continue
      }
      invitable.push(c)
    }

    if (invitable.length === 0) {
      return NextResponse.json({ invited: 0, skipped })
    }

    // Upsert each invitation inside a single transaction so a partial
    // failure doesn't leave some invites in an inconsistent state.
    await prisma.$transaction(
      invitable.map((c) =>
        prisma.orderInvitation.upsert({
          where: { orderId_creatorId: { orderId, creatorId: c.id } },
          create: {
            orderId,
            creatorId: c.id,
            invitedByUserId: session.user.id,
            message: message ?? null,
            status: "PENDING",
          },
          update: {
            invitedByUserId: session.user.id,
            message: message ?? null,
            status: "PENDING",
            respondedAt: null,
          },
        })
      )
    )

    // Fire-and-forget notifications (in-app + email) per invited creator.
    const inviterName = session.user.name ?? order.brand.companyName ?? "A brand"
    for (const c of invitable) {
      createNotification(
        c.user.id,
        "order_invitation",
        `You've been invited: ${order.title}`,
        `${inviterName} invited you to join the campaign "${order.title}".`,
        `/creator/invitations`
      )
      if (c.user.email) {
        sendInvitationSentEmail(
          c.user.email,
          c.user.name ?? `@${c.tiktokUsername}`,
          order.title,
          inviterName,
          message ?? null
        )
      }
    }

    return NextResponse.json(
      { invited: invitable.length, skipped },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating batch invitations:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
