import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { verifyState } from "@/lib/verify-state"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.foxolog.com"
  const requestId = request.headers.get("x-request-id") ?? undefined
  const log = logger.child({
    route: "api/verify-tiktok/callback",
    ...(requestId ? { requestId } : {}),
  })

  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.redirect(new URL("/login", appUrl))
    }

    const code = request.nextUrl.searchParams.get("code")
    const state = request.nextUrl.searchParams.get("state")
    const error = request.nextUrl.searchParams.get("error")

    if (error) {
      return NextResponse.redirect(
        new URL("/creator/profile?verify=error&reason=denied", appUrl)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/creator/profile?verify=error&reason=missing_params", appUrl)
      )
    }

    const stateData = verifyState(state)
    if (!stateData) {
      return NextResponse.redirect(
        new URL("/creator/profile?verify=error&reason=expired", appUrl)
      )
    }

    if (stateData.userId !== session.user.id) {
      return NextResponse.redirect(
        new URL("/creator/profile?verify=error&reason=user_mismatch", appUrl)
      )
    }

    // Exchange code for access token
    const clientKey = process.env.AUTH_TIKTOK_ID!
    const clientSecret = process.env.AUTH_TIKTOK_SECRET!
    const redirectUri = `${appUrl}/api/verify-tiktok/callback`

    const tokenResponse = await fetch(
      "https://open.tiktokapis.com/v2/oauth/token/",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_key: clientKey,
          client_secret: clientSecret,
          code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        }),
      }
    )

    if (!tokenResponse.ok) {
      log.warn(
        { event: "tiktok_token_exchange_failed", status: tokenResponse.status },
        "TikTok token exchange failed"
      )
      return NextResponse.redirect(
        new URL("/creator/profile?verify=error&reason=token_failed", appUrl)
      )
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    if (!accessToken) {
      log.warn(
        { event: "tiktok_no_access_token", tokenData },
        "TikTok token exchange returned no access_token"
      )
      return NextResponse.redirect(
        new URL("/creator/profile?verify=error&reason=no_token", appUrl)
      )
    }

    // Fetch TikTok user info
    const userInfoResponse = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,username,display_name,avatar_url,follower_count,following_count,likes_count,video_count",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )

    if (!userInfoResponse.ok) {
      log.warn(
        {
          event: "tiktok_userinfo_fetch_failed",
          status: userInfoResponse.status,
        },
        "TikTok userinfo fetch failed"
      )
      return NextResponse.redirect(
        new URL("/creator/profile?verify=error&reason=userinfo_failed", appUrl)
      )
    }

    const userInfoData = await userInfoResponse.json()
    const tiktokUser = userInfoData.data?.user

    if (!tiktokUser?.username) {
      log.warn(
        { event: "tiktok_no_username", userInfoData },
        "TikTok userinfo returned no username"
      )
      return NextResponse.redirect(
        new URL("/creator/profile?verify=error&reason=no_username", appUrl)
      )
    }

    // Match TikTok username with the creator's profile
    const tiktokUsername = tiktokUser.username.toLowerCase()
    const expectedUsername = stateData.tiktokUsername
      .toLowerCase()
      .replace(/^@/, "")

    if (tiktokUsername !== expectedUsername) {
      return NextResponse.redirect(
        new URL(
          `/creator/profile?verify=error&reason=username_mismatch&got=${encodeURIComponent(tiktokUser.username)}&expected=${encodeURIComponent(stateData.tiktokUsername)}`,
          appUrl
        )
      )
    }

    // Username matches — mark as verified and update metrics
    const updateData: Record<string, unknown> = {
      tiktokVerified: true,
      verifiedAt: new Date(),
      verificationMethod: "OAUTH",
      verificationCode: null,
      verificationCodeExp: null,
      tiktokId: tiktokUser.open_id,
      metricsUpdatedAt: new Date(),
    }

    if (tiktokUser.follower_count !== undefined) {
      updateData.followerCount = tiktokUser.follower_count
    }
    if (tiktokUser.likes_count !== undefined) {
      updateData.totalLikes = tiktokUser.likes_count
    }
    if (tiktokUser.video_count !== undefined) {
      updateData.totalVideos = tiktokUser.video_count
    }

    await prisma.creator.update({
      where: { id: stateData.creatorId },
      data: updateData,
    })

    return NextResponse.redirect(
      new URL("/creator/profile?verify=success", appUrl)
    )
  } catch (error) {
    log.error(
      { event: "tiktok_callback_error", err: error },
      "Error in TikTok verification callback"
    )
    return NextResponse.redirect(
      new URL("/creator/profile?verify=error&reason=server", appUrl)
    )
  }
}
