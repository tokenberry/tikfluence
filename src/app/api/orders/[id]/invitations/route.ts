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
 * Order invitations (F4) — brand-side creates a `PENDING` invitation
 * for a specific creator. The creator's `/creator/invitations` inbox
 * lists it; accepting routes through `/api/invitations/[id]/respond`
 * which creates an `OrderAssignment` row (same state machine as the
 * public `accept` endpoint) and flips the invitation to `ACCEPTED`.
 */

const postBodySchema = z.object({
  creatorId: z.string().min(1),
  message: z.string().max(1000).optional(),
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

    const rl = rateLimit(
      `order-invite:${session.user.id}`,
      RATE_LIMITS.api
    )
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many invitations, slow down." },
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
    const { creatorId, message } = parsed.data

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        brand: { select: { id: true, userId: true } },
        agency: { select: { userId: true } },
      },
    })
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Load account managers for the brand + managing agency.
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

    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
      select: {
        id: true,
        tiktokUsername: true,
        user: {
          select: { id: true, name: true, email: true, isActive: true },
        },
      },
    })
    if (!creator || !creator.user.isActive) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 })
    }

    // Reject if the creator is already assigned to the order.
    const alreadyAssigned = await prisma.orderAssignment.findFirst({
      where: { orderId, creatorId },
      select: { id: true },
    })
    if (alreadyAssigned) {
      return NextResponse.json(
        { error: "This creator is already assigned to the order." },
        { status: 409 }
      )
    }

    // Upsert: if a previous invitation exists (e.g. WITHDRAWN or DECLINED),
    // re-open it to PENDING instead of failing on the unique constraint.
    const invitation = await prisma.orderInvitation.upsert({
      where: { orderId_creatorId: { orderId, creatorId } },
      create: {
        orderId,
        creatorId,
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

    // Fire-and-forget notification to the invited creator (in-app + email).
    const inviterName = session.user.name ?? "A brand"
    createNotification(
      creator.user.id,
      "order_invitation",
      `You've been invited: ${order.title}`,
      `${inviterName} invited you to join the campaign "${order.title}".`,
      `/creator/invitations`
    )
    if (creator.user.email) {
      sendInvitationSentEmail(
        creator.user.email,
        creator.user.name ?? `@${creator.tiktokUsername}`,
        order.title,
        inviterName,
        message ?? null
      )
    }

    return NextResponse.json(invitation, { status: 201 })
  } catch (error) {
    console.error("Error creating order invitation:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
