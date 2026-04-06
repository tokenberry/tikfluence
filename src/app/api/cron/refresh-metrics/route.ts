import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fetchTikTokUserInfo } from "@/lib/tiktok"
import { calculateCreatorScore } from "@/lib/scoring"

export const dynamic = "force-dynamic"
export const maxDuration = 300 // 5 minutes for batch processing

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends this header for cron jobs)
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    // Find creators with stale metrics (>7 days old or never refreshed)
    const staleCreators = await prisma.creator.findMany({
      where: {
        OR: [
          { metricsUpdatedAt: null },
          { metricsUpdatedAt: { lt: sevenDaysAgo } },
        ],
      },
      select: {
        id: true,
        tiktokUsername: true,
        bio: true,
        portfolioLinks: true,
        categories: { select: { categoryId: true } },
      },
      take: 50, // Process in batches of 50 to avoid timeout
    })

    let refreshed = 0
    let failed = 0

    for (const creator of staleCreators) {
      try {
        const data = await fetchTikTokUserInfo(creator.tiktokUsername)
        if (!data) {
          failed++
          continue
        }

        const scoreResult = calculateCreatorScore({
          followerCount: data.userInfo.followerCount,
          avgViews: data.videoMetrics.avgViews,
          engagementRate: data.videoMetrics.engagementRate,
          totalVideos: data.userInfo.totalVideos,
          bio: creator.bio,
          categoryCount: creator.categories.length,
          portfolioLinkCount: creator.portfolioLinks.length,
        })

        await prisma.creator.update({
          where: { id: creator.id },
          data: {
            followerCount: data.userInfo.followerCount,
            avgViews: data.videoMetrics.avgViews,
            engagementRate: data.videoMetrics.engagementRate,
            totalLikes: data.userInfo.totalLikes,
            totalVideos: data.userInfo.totalVideos,
            score: scoreResult.score,
            tier: scoreResult.tier,
            pricePerThousand: scoreResult.pricePerThousand,
            metricsUpdatedAt: new Date(),
          },
        })

        refreshed++
      } catch (err) {
        console.error(`Failed to refresh creator ${creator.tiktokUsername}:`, err)
        failed++
      }
    }

    return NextResponse.json({
      success: true,
      total: staleCreators.length,
      refreshed,
      failed,
    })
  } catch (error) {
    console.error("Cron refresh-metrics error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
