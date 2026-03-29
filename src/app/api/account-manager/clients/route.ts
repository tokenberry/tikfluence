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

    const [brandAssignments, agencyAssignments] = await Promise.all([
      prisma.accountManagerBrand.findMany({
        where: { accountManagerId: accountManager.id },
        include: {
          brand: {
            include: {
              user: { select: { name: true, email: true } },
              _count: { select: { orders: true } },
            },
          },
        },
      }),
      prisma.accountManagerAgency.findMany({
        where: { accountManagerId: accountManager.id },
        include: {
          agency: {
            include: {
              user: { select: { name: true, email: true } },
              _count: { select: { managedBrands: true } },
            },
          },
        },
      }),
    ])

    const brands = brandAssignments.map((a) => ({
      ...a.brand,
      priority: a.priority,
    }))

    const agencies = agencyAssignments.map((a) => ({
      ...a.agency,
      priority: a.priority,
    }))

    return NextResponse.json({ brands, agencies })
  } catch (error) {
    console.error("Error fetching AM clients:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
