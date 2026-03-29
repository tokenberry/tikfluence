import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { getDeliveryAnalysis } from "@/lib/ai"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Verify the user has access to this order
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        brand: { select: { userId: true } },
        assignments: {
          select: {
            creator: { select: { userId: true } },
            network: { select: { userId: true } },
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const role = session.user.role
    const userId = session.user.id

    const hasAccess =
      role === "ADMIN" ||
      role === "ACCOUNT_MANAGER" ||
      order.brand.userId === userId ||
      order.assignments.some(
        (a) => a.creator?.userId === userId || a.network?.userId === userId
      )

    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const analysis = await getDeliveryAnalysis(id)

    if (!analysis) {
      return NextResponse.json({ analysis: null })
    }

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error("Error fetching delivery analysis:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
