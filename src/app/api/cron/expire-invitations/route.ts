import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { createNotification } from "@/lib/notifications"
import { sendInvitationExpiredEmail } from "@/lib/email"

export const dynamic = "force-dynamic"

/**
 * F4 (v4.1.0): auto-expire stale `PENDING` order invitations.
 *
 * Sweeps `OrderInvitation` rows older than `INVITATION_EXPIRY_DAYS`
 * (default 7) that are still `PENDING`, flips them to `EXPIRED`, and
 * notifies the original inviter (in-app + email) so they know to try
 * another creator from the AI match list.
 *
 * Runs daily via Vercel Cron. Protected by `CRON_SECRET` like the
 * other cron routes (`expire-orders`, `refresh-metrics`).
 */

const INVITATION_EXPIRY_DAYS = Number(
  process.env.INVITATION_EXPIRY_DAYS ?? 7
)
const BATCH_LIMIT = 200

export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") ?? undefined
  const log = logger.child({
    route: "api/cron/expire-invitations",
    ...(requestId ? { requestId } : {}),
  })

  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const cutoff = new Date(
      Date.now() - INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    )

    // Load the expirable batch up-front so we have the inviter/creator
    // context needed for notifications + email, then flip status in one
    // updateMany call.
    const stale = await prisma.orderInvitation.findMany({
      where: {
        status: "PENDING",
        createdAt: { lt: cutoff },
      },
      take: BATCH_LIMIT,
      select: {
        id: true,
        orderId: true,
        creatorId: true,
        invitedByUserId: true,
        order: { select: { id: true, title: true } },
        creator: {
          select: {
            tiktokUsername: true,
            user: { select: { name: true } },
          },
        },
        invitedByUser: { select: { name: true, email: true } },
      },
    })

    if (stale.length === 0) {
      log.info(
        { event: "cron_expire_invitations_empty" },
        "Cron expire-invitations: nothing to expire"
      )
      return NextResponse.json({ success: true, expired: 0 })
    }

    const staleIds = stale.map((s) => s.id)
    const now = new Date()
    const updated = await prisma.orderInvitation.updateMany({
      where: { id: { in: staleIds }, status: "PENDING" },
      data: { status: "EXPIRED", respondedAt: now },
    })

    // Fire-and-forget notifications to the inviter for each expired row.
    for (const inv of stale) {
      const creatorName =
        inv.creator.user.name ?? `@${inv.creator.tiktokUsername}`
      createNotification(
        inv.invitedByUserId,
        "invitation_expired",
        `Invitation to ${creatorName} expired`,
        `Your invitation to ${creatorName} for "${inv.order.title}" expired after ${INVITATION_EXPIRY_DAYS} days without a response.`,
        `/brand/orders/${inv.order.id}`
      )
      if (inv.invitedByUser?.email) {
        sendInvitationExpiredEmail(
          inv.invitedByUser.email,
          inv.invitedByUser.name ?? "there",
          creatorName,
          inv.order.title,
          INVITATION_EXPIRY_DAYS
        )
      }
    }

    log.info(
      {
        event: "cron_expire_invitations_complete",
        checked: stale.length,
        expired: updated.count,
        cutoff: cutoff.toISOString(),
      },
      "Cron expire-invitations batch finished"
    )

    return NextResponse.json({
      success: true,
      expired: updated.count,
      checked: stale.length,
    })
  } catch (error) {
    log.error(
      { event: "cron_expire_invitations_error", err: error },
      "Cron expire-invitations crashed"
    )
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
