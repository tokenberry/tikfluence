import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ACCOUNT_MANAGER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const accountManager = await prisma.accountManager.findUnique({
      where: { userId: session.user.id },
    })

    if (!accountManager) {
      return NextResponse.json({ error: "Account manager not found" }, { status: 404 })
    }

    // Get all brand IDs assigned to this AM
    const brandAssignments = await prisma.accountManagerBrand.findMany({
      where: { accountManagerId: accountManager.id },
      select: { brandId: true },
    })

    const brandIds = brandAssignments.map((a) => a.brandId)

    const orders = await prisma.order.findMany({
      where: { brandId: { in: brandIds } },
      include: {
        brand: { select: { companyName: true } },
        category: { select: { name: true } },
        _count: { select: { assignments: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error("Error fetching AM orders:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
