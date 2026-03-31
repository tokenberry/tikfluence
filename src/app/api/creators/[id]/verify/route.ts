import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { fetchTikTokUserInfo } from "@/lib/tiktok"
import { calculateCreatorScore } from "@/lib/scoring"
import { z } from "zod"
import crypto from "crypto"

export const dynamic = "force-dynamic"

const verifySchema = z.object({
  action: z.enum(["generate", "check"]),
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

    const { id } = await params

    const creator = await prisma.creator.findUnique({
      where: { id },
      include: { categories: true },
    })

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 })
    }

    if (creator.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = verifySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { action } = parsed.data

    if (action === "generate") {
      if (creator.tiktokVerified) {
        return NextResponse.json(
          { error: "Already verified" },
          { status: 400 }
        )
      }

      // Return existing active code if not expired
      if (
        creator.verificationCode &&
        creator.verificationCodeExp &&
        creator.verificationCodeExp > new Date()
      ) {
        return NextResponse.json({
          verificationCode: creator.verificationCode,
          expiresAt: creator.verificationCodeExp.toISOString(),
        })
      }

      // Generate new code
      const code = `foxolog-${crypto.randomBytes(16).toString("hex")}`
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

      await prisma.creator.update({
        where: { id },
        data: {
          verificationCode: code,
          verificationCodeExp: expiresAt,
        },
      })

      return NextResponse.json({
        verificationCode: code,
        expiresAt: expiresAt.toISOString(),
      })
    }

    // action === "check"
    if (!creator.verificationCode) {
      return NextResponse.json(
        { error: "No verification code generated. Please generate one first." },
        { status: 400 }
      )
    }

    if (
      creator.verificationCodeExp &&
      creator.verificationCodeExp < new Date()
    ) {
      // Clear expired code
      await prisma.creator.update({
        where: { id },
        data: {
          verificationCode: null,
          verificationCodeExp: null,
        },
      })
      return NextResponse.json(
        { error: "Verification code expired. Please generate a new one." },
        { status: 400 }
      )
    }

    // Dev bypass: auto-pass when no TikTok API key
    const isDev = !process.env.TIKTOK_API_KEY
    let tiktokData = null

    if (!isDev) {
      tiktokData = await fetchTikTokUserInfo(creator.tiktokUsername)
      if (!tiktokData) {
        return NextResponse.json(
          { error: "TikTok API is temporarily unavailable. Please try again later." },
          { status: 502 }
        )
      }

      // Check if code is in bio
      if (
        !tiktokData.userInfo.bio
          .toLowerCase()
          .includes(creator.verificationCode.toLowerCase())
      ) {
        return NextResponse.json({
          verified: false,
          message:
            "Code not found in your TikTok bio. Make sure you saved your bio and try again.",
        })
      }
    }

    // Verification passed — update creator
    const updateData: Record<string, unknown> = {
      tiktokVerified: true,
      verifiedAt: new Date(),
      verificationMethod: "BIO_CODE",
      verificationCode: null,
      verificationCodeExp: null,
    }

    // Also pull metrics if we have TikTok data
    if (tiktokData) {
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

      Object.assign(updateData, {
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
      })
    }

    const updated = await prisma.creator.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      verified: true,
      verifiedAt: updated.verifiedAt?.toISOString(),
    })
  } catch (error) {
    console.error("Error in verification:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
