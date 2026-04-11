import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { canReviewContentDraft } from "@/lib/guards"
import { createNotification } from "@/lib/notifications"
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { z } from "zod"

export const dynamic = "force-dynamic"

/**
 * Approve or reject a pending content draft. Brand owner, managing agency,
 * assigned account manager, or admin may review.
 *
 * Drafts are advisory only — approving or rejecting does NOT change the
 * order's own status. This is deliberately NOT the delivery review flow.
 */

const reviewSchema = z.object({
  approved: z.boolean(),
  reviewNotes: z.string().max(2000).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; draftId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rl = rateLimit(
      `order-draft-review:${session.user.id}`,
      RATE_LIMITS.api
    )
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many reviews, slow down." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      )
    }

    const { id: orderId, draftId } = await params

    const draft = await prisma.contentDraft.findUnique({
      where: { id: draftId },
      include: {
        order: {
          include: {
            brand: { select: { id: true, userId: true } },
            agency: { select: { userId: true } },
          },
        },
      },
    })

    if (!draft || draft.orderId !== orderId) {
      return NextResponse.json(
        { error: "Draft not found" },
        { status: 404 }
      )
    }

    if (draft.status !== "PENDING_REVIEW") {
      return NextResponse.json(
        { error: "Draft has already been reviewed" },
        { status: 400 }
      )
    }

    // Gather account managers for the owning brand (and, if applicable,
    // the managing agency) so AM reviewers pass the guard check.
    const amAssignments = await prisma.accountManagerBrand.findMany({
      where: { brandId: draft.order.brand.id },
      select: { accountManager: { select: { userId: true } } },
    })
    let amUserIds = amAssignments
      .map((a) => a.accountManager?.userId)
      .filter((x): x is string => typeof x === "string")
    if (draft.order.agency) {
      const agencyAm = await prisma.accountManagerAgency.findMany({
        where: { agency: { userId: draft.order.agency.userId } },
        select: { accountManager: { select: { userId: true } } },
      })
      amUserIds = [
        ...amUserIds,
        ...agencyAm
          .map((a) => a.accountManager?.userId)
          .filter((x): x is string => typeof x === "string"),
      ]
    }

    const userId = session.user.id
    const role = session.user.role

    const allowed = canReviewContentDraft({
      userId,
      role,
      brandUserId: draft.order.brand.userId,
      assignmentCreatorUserId: draft.creatorUserId,
      assignmentNetworkUserId: null,
      agencyUserId: draft.order.agency?.userId ?? null,
      accountManagerUserIds: Array.from(new Set(amUserIds)),
    })
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const json = await request.json()
    const parsed = reviewSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { approved, reviewNotes } = parsed.data

    // Transactional update with a re-check to prevent double-review races.
    const result = await prisma.$transaction(async (tx) => {
      const fresh = await tx.contentDraft.findUnique({
        where: { id: draftId },
        select: { status: true },
      })
      if (fresh?.status !== "PENDING_REVIEW") {
        return { error: "ALREADY_REVIEWED" as const }
      }
      const updated = await tx.contentDraft.update({
        where: { id: draftId },
        data: {
          status: approved ? "APPROVED" : "REJECTED",
          reviewerUserId: userId,
          reviewNotes: reviewNotes ?? null,
          reviewedAt: new Date(),
        },
      })
      return { ok: true as const, draft: updated }
    })

    if ("error" in result) {
      return NextResponse.json(
        { error: "Draft has already been reviewed" },
        { status: 400 }
      )
    }

    // Notify the uploader of the review outcome.
    const reviewerName = session.user.name ?? "Your reviewer"
    const recipientUser = await prisma.user.findUnique({
      where: { id: draft.creatorUserId },
      select: { role: true },
    })
    const link = buildOrderDetailPath(
      recipientUser?.role ?? null,
      orderId
    )
    createNotification(
      draft.creatorUserId,
      approved ? "content_draft_approved" : "content_draft_rejected",
      approved
        ? `Draft approved by ${reviewerName}`
        : `Revision requested by ${reviewerName}`,
      reviewNotes
        ? reviewNotes.length > 160
          ? `${reviewNotes.slice(0, 157)}...`
          : reviewNotes
        : approved
          ? "You can publish the content to TikTok."
          : "Please review the notes and upload a new draft.",
      link
    ).catch((err) => console.error("Draft review notification failed:", err))

    return NextResponse.json(result.draft)
  } catch (error) {
    console.error("Error reviewing content draft:", error)
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
