import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { analyzeCreator, getLatestCreatorAnalysis } from "@/lib/ai"

export const dynamic = "force-dynamic"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const creator = await prisma.creator.findUnique({
      where: { id },
      include: {
        user: { select: { id: true } },
        categories: {
          include: { category: true },
        },
      },
    })

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 })
    }

    // Only the creator themselves or an admin can trigger analysis
    if (session.user.role !== "ADMIN" && creator.user.id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "AI analysis is not configured. Set ANTHROPIC_API_KEY." },
        { status: 503 }
      )
    }

    const result = await analyzeCreator({
      id: creator.id,
      tiktokUsername: creator.tiktokUsername,
      followerCount: creator.followerCount,
      avgViews: creator.avgViews,
      engagementRate: creator.engagementRate,
      totalLikes: creator.totalLikes,
      totalVideos: creator.totalVideos,
      score: creator.score,
      tier: creator.tier,
      pricePerThousand: creator.pricePerThousand,
      bio: creator.bio,
      categories: creator.categories.map((c) => c.category.name),
      portfolioLinks: creator.portfolioLinks,
      supportsLive: creator.supportsLive,
      supportsShortVideo: creator.supportsShortVideo,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error running AI analysis:", error)
    return NextResponse.json(
      { error: "Failed to run AI analysis" },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const analysis = await getLatestCreatorAnalysis(id)

    if (!analysis) {
      return NextResponse.json({ analysis: null })
    }

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error("Error fetching AI analysis:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
