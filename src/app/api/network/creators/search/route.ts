import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "NETWORK") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const q = searchParams.get("q")

    if (!q || !type) {
      return NextResponse.json(
        { error: "Missing search parameters" },
        { status: 400 }
      )
    }

    const where =
      type === "email"
        ? { user: { email: { contains: q, mode: "insensitive" as const } } }
        : { tiktokUsername: { contains: q, mode: "insensitive" as const } }

    const creators = await prisma.creator.findMany({
      where: {
        ...where,
        networkId: null,
      },
      include: {
        user: { select: { name: true, email: true } },
      },
      take: 20,
    })

    return NextResponse.json({ creators })
  } catch (error) {
    console.error("Error searching creators:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
