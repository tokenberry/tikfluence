import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createVerifyState } from "@/lib/verify-state"

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
    })

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 })
    }

    if (creator.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (creator.tiktokVerified) {
      return NextResponse.json({ error: "Already verified" }, { status: 400 })
    }

    const clientKey = process.env.AUTH_TIKTOK_ID
    if (!clientKey) {
      return NextResponse.json(
        { error: "TikTok integration not configured" },
        { status: 503 }
      )
    }

    const state = createVerifyState(
      creator.id,
      session.user.id,
      creator.tiktokUsername
    )

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.foxolog.com"
    const redirectUri = `${appUrl}/api/verify-tiktok/callback`

    const authUrl = new URL("https://www.tiktok.com/v2/auth/authorize")
    authUrl.searchParams.set("client_key", clientKey)
    authUrl.searchParams.set("scope", "user.info.basic,user.info.profile")
    authUrl.searchParams.set("response_type", "code")
    authUrl.searchParams.set("redirect_uri", redirectUri)
    authUrl.searchParams.set("state", state)

    return NextResponse.json({ authUrl: authUrl.toString() })
  } catch (error) {
    console.error("Error initiating TikTok verification:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
