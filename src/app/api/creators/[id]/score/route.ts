import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { calculateCreatorScore } from "@/lib/scoring"
import { fetchTikTokUserInfo } from "@/lib/tiktok"

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
        categories: true,
      },
    })

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 })
    }

    if (creator.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const tiktokData = await fetchTikTokUserInfo(creator.tiktokUsername)

    if (!tiktokData) {
      return NextResponse.json(
        { error: "Failed to fetch TikTok data" },
        { status: 502 }
      )
    }

    const { userInfo, videoMetrics } = tiktokData

    const scoreResult = calculateCreatorScore({
      followerCount: userInfo.followerCount,
      avgViews: videoMetrics.avgViews,
      engagementRate: videoMetrics.engagementRate,
      totalVideos: userInfo.totalVideos,
      bio: creator.bio,
      categoryCount: creator.categories.length,
      portfolioLinkCount: creator.portfolioLinks.length,
    })

    const updated = await prisma.creator.update({
      where: { id },
      data: {
        followerCount: userInfo.followerCount,
        avgViews: videoMetrics.avgViews,
        engagementRate: videoMetrics.engagementRate,
        totalLikes: userInfo.totalLikes,
        totalVideos: userInfo.totalVideos,
        tiktokId: userInfo.tiktokId,
        score: scoreResult.score,
        tier: scoreResult.tier,
        pricePerThousand: scoreResult.pricePerThousand,
        metricsUpdatedAt: new Date(),
      },
    })

    return NextResponse.json({
      creator: updated,
      scoreResult,
      tiktokData: {
        followerCount: userInfo.followerCount,
        avgViews: videoMetrics.avgViews,
        engagementRate: videoMetrics.engagementRate,
        totalVideos: userInfo.totalVideos,
      },
    })
  } catch (error) {
    console.error("Error recalculating score:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
