import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { canViewMatches } from "@/lib/guards"
import { rateLimit } from "@/lib/rate-limit"
import {
  matchCreatorsToOrder,
  type MatchCandidate,
  type MatchOrderInput,
} from "@/lib/ai"

export const dynamic = "force-dynamic"

/**
 * AI-driven creator matching (F4).
 *
 * `GET` returns the stored match rows (sorted by matchScore DESC) for the
 * order along with the creator profile snippet each row points at, plus
 * any existing invitation rows so the UI can render an "invited" badge
 * next to already-contacted creators.
 *
 * `POST` runs a fresh AI match round: loads a bounded candidate pool,
 * calls `matchCreatorsToOrder()`, upserts the result rows, and stamps
 * `order.matchesGeneratedAt`. Only brand-side roles (admin / brand owner
 * / managing agency / assigned account managers) can see or trigger
 * matches — creators and networks are blocked.
 */

interface OrderContext {
  brandUserId: string
  agencyUserId: string | null
  accountManagerUserIds: string[]
  order: {
    id: string
    title: string
    description: string
    brief: string | null
    type: string
    budget: number
    cpmRate: number
    impressionTarget: number
    liveFlatFee: number | null
    liveMinDuration: number | null
    requiresShipping: boolean
    categoryId: string
    categoryName: string
    status: string
  }
}

async function loadOrderContext(orderId: string): Promise<OrderContext | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      brand: { select: { id: true, userId: true } },
      agency: { select: { userId: true } },
      category: { select: { id: true, name: true } },
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
    order: {
      id: order.id,
      title: order.title,
      description: order.description,
      brief: order.brief,
      type: order.type,
      budget: order.budget,
      cpmRate: order.cpmRate,
      impressionTarget: order.impressionTarget,
      liveFlatFee: order.liveFlatFee,
      liveMinDuration: order.liveMinDuration,
      requiresShipping: order.requiresShipping,
      categoryId: order.categoryId,
      categoryName: order.category.name,
      status: order.status,
    },
  }
}

export async function GET(
  _request: NextRequest,
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

    const allowed = canViewMatches({
      userId: session.user.id,
      role: session.user.role,
      brandUserId: ctx.brandUserId,
      agencyUserId: ctx.agencyUserId,
      accountManagerUserIds: ctx.accountManagerUserIds,
    })
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const [matches, invitations, orderRow] = await Promise.all([
      prisma.aiCreatorMatch.findMany({
        where: { orderId },
        orderBy: { matchScore: "desc" },
        include: {
          creator: {
            select: {
              id: true,
              tiktokUsername: true,
              followerCount: true,
              avgViews: true,
              engagementRate: true,
              score: true,
              tier: true,
              pricePerThousand: true,
              bio: true,
              supportsLive: true,
              supportsShortVideo: true,
              user: { select: { name: true, avatar: true, image: true } },
            },
          },
        },
      }),
      prisma.orderInvitation.findMany({
        where: { orderId },
        select: {
          id: true,
          creatorId: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.order.findUnique({
        where: { id: orderId },
        select: { matchesGeneratedAt: true },
      }),
    ])

    return NextResponse.json({
      matches,
      invitations,
      matchesGeneratedAt: orderRow?.matchesGeneratedAt ?? null,
    })
  } catch (error) {
    console.error("Error listing AI creator matches:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Hard rate-limit AI generation — it's expensive (60s budget, tokens).
    // We also key on order so a single user can't hammer the same order.
    const { id: orderId } = await params
    const rl = rateLimit(
      `ai-match:${session.user.id}:${orderId}`,
      { limit: 5, window: 60 * 1000 }
    )
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many match generation requests, slow down." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      )
    }

    const ctx = await loadOrderContext(orderId)
    if (!ctx) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const allowed = canViewMatches({
      userId: session.user.id,
      role: session.user.role,
      brandUserId: ctx.brandUserId,
      agencyUserId: ctx.agencyUserId,
      accountManagerUserIds: ctx.accountManagerUserIds,
    })
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Do NOT allow matching on orders that are already in a terminal state.
    if (
      ctx.order.status === "COMPLETED" ||
      ctx.order.status === "CANCELLED"
    ) {
      return NextResponse.json(
        {
          error:
            "Cannot generate matches for completed or cancelled orders.",
        },
        { status: 409 }
      )
    }

    // Load the candidate pool: creators in the order's category,
    // active users, not already assigned or invited. We cap at 60 so
    // the prompt stays bounded; the AI function slices to 50 internally.
    const [existingAssignments, existingInvitations] = await Promise.all([
      prisma.orderAssignment.findMany({
        where: { orderId, creatorId: { not: null } },
        select: { creatorId: true },
      }),
      prisma.orderInvitation.findMany({
        where: { orderId, status: "PENDING" },
        select: { creatorId: true },
      }),
    ])
    const excludedCreatorIds = new Set<string>([
      ...existingAssignments
        .map((a) => a.creatorId)
        .filter((x): x is string => x !== null),
      ...existingInvitations.map((i) => i.creatorId),
    ])

    // Category restriction + type compatibility. COMBO orders require
    // both supportsLive AND supportsShortVideo; LIVE requires supportsLive;
    // SHORT_VIDEO requires supportsShortVideo.
    const typeFilter =
      ctx.order.type === "LIVE"
        ? { supportsLive: true }
        : ctx.order.type === "SHORT_VIDEO"
        ? { supportsShortVideo: true }
        : { supportsLive: true, supportsShortVideo: true }

    const candidateRows = await prisma.creator.findMany({
      where: {
        ...typeFilter,
        id: { notIn: Array.from(excludedCreatorIds) },
        user: { isActive: true, role: "CREATOR" },
        categories: { some: { categoryId: ctx.order.categoryId } },
      },
      orderBy: [{ score: "desc" }, { followerCount: "desc" }],
      take: 60,
      select: {
        id: true,
        tiktokUsername: true,
        followerCount: true,
        avgViews: true,
        engagementRate: true,
        score: true,
        tier: true,
        pricePerThousand: true,
        bio: true,
        supportsLive: true,
        supportsShortVideo: true,
        user: { select: { name: true } },
        categories: { select: { category: { select: { name: true } } } },
      },
    })

    if (candidateRows.length === 0) {
      return NextResponse.json(
        {
          error:
            "No eligible creators found for this campaign. Try broadening the category or content type.",
        },
        { status: 404 }
      )
    }

    const candidates: MatchCandidate[] = candidateRows.map((c) => ({
      id: c.id,
      tiktokUsername: c.tiktokUsername,
      name: c.user.name,
      followerCount: c.followerCount,
      avgViews: c.avgViews,
      engagementRate: c.engagementRate,
      score: c.score,
      tier: c.tier,
      pricePerThousand: c.pricePerThousand,
      bio: c.bio,
      categories: c.categories.map((cc) => cc.category.name),
      supportsLive: c.supportsLive,
      supportsShortVideo: c.supportsShortVideo,
    }))

    const input: MatchOrderInput = {
      orderId: ctx.order.id,
      title: ctx.order.title,
      description: ctx.order.description,
      brief: ctx.order.brief,
      categoryName: ctx.order.categoryName,
      orderType: ctx.order.type,
      budget: ctx.order.budget,
      cpmRate: ctx.order.cpmRate,
      impressionTarget: ctx.order.impressionTarget,
      liveFlatFee: ctx.order.liveFlatFee,
      liveMinDuration: ctx.order.liveMinDuration,
      requiresShipping: ctx.order.requiresShipping,
    }

    const matches = await matchCreatorsToOrder(input, candidates)

    // Persist: upsert each match row and stamp the order's generatedAt.
    // Wrapped in a transaction so a mid-write crash doesn't leave the
    // order half-updated.
    await prisma.$transaction([
      ...matches.map((m) =>
        prisma.aiCreatorMatch.upsert({
          where: {
            orderId_creatorId: { orderId, creatorId: m.creatorId },
          },
          create: {
            orderId,
            creatorId: m.creatorId,
            matchScore: m.matchScore,
            matchReason: m.matchReason,
            reasoning: m.reasoning ?? undefined,
          },
          update: {
            matchScore: m.matchScore,
            matchReason: m.matchReason,
            reasoning: m.reasoning ?? undefined,
          },
        })
      ),
      prisma.order.update({
        where: { id: orderId },
        data: { matchesGeneratedAt: new Date() },
      }),
    ])

    return NextResponse.json({
      matchesGenerated: matches.length,
      candidatePoolSize: candidates.length,
    })
  } catch (error) {
    console.error("Error generating AI creator matches:", error)
    const message =
      error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
