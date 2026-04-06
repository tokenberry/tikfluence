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

    // Find the brand (direct brand user or agency managing brands)
    const brand = await prisma.brand.findUnique({
      where: { userId: session.user.id },
    })

    if (!brand) {
      return NextResponse.json({ balance: 0, credits: [] })
    }

    const credits = await prisma.brandCredit.findMany({
      where: { brandId: brand.id },
      orderBy: { createdAt: "desc" },
    })

    const balance = credits.reduce((sum, c) => sum + c.amount, 0)

    return NextResponse.json({
      balance: Math.max(balance, 0),
      credits,
    })
  } catch (error) {
    console.error("Error fetching brand credits:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
