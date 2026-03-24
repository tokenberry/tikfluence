import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const [
      usersByRole,
      ordersByStatus,
      totalRevenue,
      recentOrders,
      totalCreators,
      totalNetworks,
      totalBrands,
    ] = await Promise.all([
      prisma.user.groupBy({
        by: ["role"],
        _count: { id: true },
      }),
      prisma.order.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      prisma.transaction.aggregate({
        _sum: { platformFee: true },
        where: { status: "RELEASED" },
      }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          brand: { select: { companyName: true } },
          category: { select: { name: true } },
        },
      }),
      prisma.creator.count(),
      prisma.creatorNetwork.count(),
      prisma.brand.count(),
    ])

    const userRoleCounts = usersByRole.reduce(
      (acc, item) => {
        acc[item.role] = item._count.id
        return acc
      },
      {} as Record<string, number>
    )

    const orderStatusCounts = ordersByStatus.reduce(
      (acc, item) => {
        acc[item.status] = item._count.id
        return acc
      },
      {} as Record<string, number>
    )

    return NextResponse.json({
      users: {
        total: Object.values(userRoleCounts).reduce((a, b) => a + b, 0),
        byRole: userRoleCounts,
        creators: totalCreators,
        networks: totalNetworks,
        brands: totalBrands,
      },
      orders: {
        total: Object.values(orderStatusCounts).reduce((a, b) => a + b, 0),
        byStatus: orderStatusCounts,
      },
      revenue: {
        totalPlatformFees: totalRevenue._sum.platformFee ?? 0,
      },
      recentOrders,
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
