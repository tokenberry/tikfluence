import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { canRespondToInvitation } from "@/lib/guards"
import { createNotification } from "@/lib/notifications"
import {
  sendInvitationAcceptedEmail,
  sendInvitationDeclinedEmail,
} from "@/lib/email"
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { z } from "zod"

export const dynamic = "force-dynamic"

/**
 * `POST /api/invitations/[id]/respond` — the invited creator accepts
 * or declines an order invitation. Accepting atomically:
 *   1. Checks the order still has room (`assignments < maxCreators`).
 *   2. Validates content-type compatibility (LIVE/SHORT_VIDEO/COMBO).
 *   3. Creates a new `OrderAssignment` row (ASSIGNED + F3 shipping init).
 *   4. Flips the invitation to `ACCEPTED` + stamps respondedAt.
 *   5. Bumps the order to `ASSIGNED` if it was still OPEN/DRAFT.
 * Declining just flips to `DECLINED` + stamps respondedAt.
 *
 * Notifies the inviter and the brand owner on both paths.
 */

const bodySchema = z.object({
  action: z.enum(["accept", "decline"]),
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
      `invite-respond:${session.user.id}`,
      RATE_LIMITS.api
    )
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many responses, slow down." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      )
    }

    const { id: invitationId } = await params
    const json = await request.json()
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { action } = parsed.data

    const invitation = await prisma.orderInvitation.findUnique({
      where: { id: invitationId },
      include: {
        order: {
          include: {
            brand: { select: { id: true, userId: true } },
          },
        },
        creator: {
          select: {
            id: true,
            tiktokUsername: true,
            supportsLive: true,
            supportsShortVideo: true,
            user: { select: { id: true, name: true } },
          },
        },
        invitedByUser: { select: { id: true, name: true, email: true } },
      },
    })
    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      )
    }

    const allowed = canRespondToInvitation({
      userId: session.user.id,
      role: session.user.role,
      invitedCreatorUserId: invitation.creator.user.id,
    })
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (invitation.status !== "PENDING") {
      return NextResponse.json(
        { error: "This invitation has already been resolved.", status: invitation.status },
        { status: 409 }
      )
    }

    const order = invitation.order

    if (order.status === "COMPLETED" || order.status === "CANCELLED") {
      return NextResponse.json(
        { error: "This order is no longer accepting creators." },
        { status: 409 }
      )
    }

    if (action === "decline") {
      await prisma.orderInvitation.update({
        where: { id: invitationId },
        data: { status: "DECLINED", respondedAt: new Date() },
      })

      // Notify inviter (in-app + email).
      const creatorName =
        invitation.creator.user.name ?? `@${invitation.creator.tiktokUsername}`
      createNotification(
        invitation.invitedByUserId,
        "invitation_declined",
        `${creatorName} declined your invitation`,
        `${creatorName} declined the invitation to "${order.title}".`,
        `/brand/orders/${order.id}`
      )
      if (invitation.invitedByUser?.email) {
        sendInvitationDeclinedEmail(
          invitation.invitedByUser.email,
          invitation.invitedByUser.name ?? "there",
          creatorName,
          order.title
        )
      }

      return NextResponse.json({ status: "DECLINED" })
    }

    // action === "accept" — check content-type compatibility first.
    const creator = invitation.creator
    if (order.type === "LIVE" && !creator.supportsLive) {
      return NextResponse.json(
        { error: "Your profile doesn't support LIVE orders." },
        { status: 403 }
      )
    }
    if (order.type === "SHORT_VIDEO" && !creator.supportsShortVideo) {
      return NextResponse.json(
        { error: "Your profile doesn't support Short Video orders." },
        { status: 403 }
      )
    }
    if (
      order.type === "COMBO" &&
      (!creator.supportsLive || !creator.supportsShortVideo)
    ) {
      return NextResponse.json(
        { error: "Combo orders require both LIVE and Short Video support." },
        { status: 403 }
      )
    }

    // Atomic accept: re-check invitation status, re-check assignment
    // count, create the assignment, flip the invitation.
    const result = await prisma
      .$transaction(async (tx) => {
        const fresh = await tx.orderInvitation.findUnique({
          where: { id: invitationId },
          select: { status: true },
        })
        if (!fresh || fresh.status !== "PENDING") {
          throw new Error("ALREADY_RESOLVED")
        }

        const count = await tx.orderAssignment.count({
          where: { orderId: order.id },
        })
        if (count >= order.maxCreators) {
          throw new Error("MAX_CREATORS_REACHED")
        }

        const existingAssignment = await tx.orderAssignment.findFirst({
          where: { orderId: order.id, creatorId: creator.id },
          select: { id: true },
        })
        if (existingAssignment) {
          throw new Error("ALREADY_ASSIGNED")
        }

        const assignment = await tx.orderAssignment.create({
          data: {
            orderId: order.id,
            creatorId: creator.id,
            status: "ASSIGNED",
            shippingStatus: order.requiresShipping
              ? "PENDING_ADDRESS"
              : "NOT_REQUIRED",
          },
        })

        await tx.orderInvitation.update({
          where: { id: invitationId },
          data: { status: "ACCEPTED", respondedAt: new Date() },
        })

        if (order.status === "DRAFT" || order.status === "OPEN") {
          await tx.order.update({
            where: { id: order.id },
            data: { status: "ASSIGNED" },
          })
        }

        return { assignmentId: assignment.id }
      })
      .catch((err) => {
        if (err.message === "ALREADY_RESOLVED") {
          return { error: "Invitation already resolved", status: 409 } as const
        }
        if (err.message === "MAX_CREATORS_REACHED") {
          return {
            error: "Maximum number of creators reached for this order",
            status: 409,
          } as const
        }
        if (err.message === "ALREADY_ASSIGNED") {
          return {
            error: "Already assigned to this order",
            status: 409,
          } as const
        }
        throw err
      })

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      )
    }

    const creatorName =
      invitation.creator.user.name ?? `@${invitation.creator.tiktokUsername}`

    // Notify inviter + brand owner (deduped, in-app).
    const recipientIds = new Set<string>([
      invitation.invitedByUserId,
      order.brand.userId,
    ])
    recipientIds.delete(session.user.id)
    for (const id of recipientIds) {
      createNotification(
        id,
        "invitation_accepted",
        `${creatorName} accepted your invitation`,
        `${creatorName} accepted the invitation to "${order.title}".`,
        `/brand/orders/${order.id}`
      )
    }

    // Email the inviter (if they have an email on record).
    if (invitation.invitedByUser?.email) {
      sendInvitationAcceptedEmail(
        invitation.invitedByUser.email,
        invitation.invitedByUser.name ?? "there",
        creatorName,
        order.title
      )
    }

    return NextResponse.json({
      status: "ACCEPTED",
      assignmentId: result.assignmentId,
    })
  } catch (error) {
    console.error("Error responding to invitation:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
