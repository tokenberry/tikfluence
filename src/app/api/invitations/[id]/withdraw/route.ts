import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { canWithdrawInvitation } from "@/lib/guards"
import { createNotification } from "@/lib/notifications"
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

/**
 * `POST /api/invitations/[id]/withdraw` — F4 completion (v4.0.1).
 *
 * The brand-side team (brand owner / managing agency / assigned account
 * managers / admin) cancels a `PENDING` invitation. The row flips to
 * `WITHDRAWN` + stamps `respondedAt`; the creator is notified so their
 * inbox card disappears from the pending bucket.
 *
 * If the invitation is already `ACCEPTED` / `DECLINED` / `WITHDRAWN` /
 * `EXPIRED`, the route returns 409 `ALREADY_RESOLVED` — withdraw only
 * works on still-pending invitations (use admin tooling to reverse an
 * accepted assignment).
 */

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rl = rateLimit(
      `invite-withdraw:${session.user.id}`,
      RATE_LIMITS.api
    )
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many withdrawals, slow down." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      )
    }

    const { id: invitationId } = await params

    const invitation = await prisma.orderInvitation.findUnique({
      where: { id: invitationId },
      include: {
        order: {
          include: {
            brand: { select: { id: true, userId: true } },
            agency: { select: { userId: true } },
          },
        },
        creator: {
          select: {
            id: true,
            tiktokUsername: true,
            user: { select: { id: true, name: true } },
          },
        },
      },
    })
    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      )
    }

    // Load account managers for the brand + managing agency to build
    // the guard context (mirrors the single-invite endpoint).
    const order = invitation.order
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

    const allowed = canWithdrawInvitation({
      userId: session.user.id,
      role: session.user.role,
      brandUserId: order.brand.userId,
      agencyUserId: order.agency?.userId ?? null,
      accountManagerUserIds: Array.from(new Set(amUserIds)),
    })
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (invitation.status !== "PENDING") {
      return NextResponse.json(
        {
          error: "This invitation has already been resolved.",
          status: invitation.status,
        },
        { status: 409 }
      )
    }

    // Atomic status flip: re-read inside a transaction so a simultaneous
    // accept doesn't race with this withdraw.
    const result = await prisma
      .$transaction(async (tx) => {
        const fresh = await tx.orderInvitation.findUnique({
          where: { id: invitationId },
          select: { status: true },
        })
        if (!fresh || fresh.status !== "PENDING") {
          throw new Error("ALREADY_RESOLVED")
        }
        await tx.orderInvitation.update({
          where: { id: invitationId },
          data: { status: "WITHDRAWN", respondedAt: new Date() },
        })
        return { ok: true }
      })
      .catch((err) => {
        if (err.message === "ALREADY_RESOLVED") {
          return { error: "Invitation already resolved", status: 409 } as const
        }
        throw err
      })

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      )
    }

    // Notify the invited creator so the inbox row disappears.
    const brandLabel = "the brand"
    createNotification(
      invitation.creator.user.id,
      "invitation_withdrawn",
      `Invitation withdrawn: ${order.title}`,
      `${brandLabel} withdrew the invitation to "${order.title}".`,
      `/creator/invitations`
    )

    return NextResponse.json({ status: "WITHDRAWN" })
  } catch (error) {
    console.error("Error withdrawing invitation:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
