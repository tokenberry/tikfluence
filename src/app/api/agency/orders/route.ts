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

    if (session.user.role !== "AGENCY") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const agency = await prisma.agency.findUnique({
      where: { userId: session.user.id },
    })

    if (!agency) {
      return NextResponse.json({ error: "Agency profile not found" }, { status: 404 })
    }

    const orders = await prisma.order.findMany({
      where: { agencyId: agency.id },
      orderBy: { createdAt: "desc" },
      include: {
        brand: {
          select: { companyName: true },
        },
        category: {
          select: { name: true },
        },
        _count: {
          select: { assignments: true },
        },
      },
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error("Error listing agency orders:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
