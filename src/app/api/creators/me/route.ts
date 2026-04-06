import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const creator = await prisma.creator.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        bio: true,
        portfolioLinks: true,
        tiktokUsername: true,
        supportsShortVideo: true,
        supportsLive: true,
      },
    })

    return NextResponse.json({ creator })
  } catch (error) {
    console.error("Error fetching creator:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
