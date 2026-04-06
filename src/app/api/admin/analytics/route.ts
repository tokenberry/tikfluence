import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get the last 6 months for time-series
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    sixMonthsAgo.setDate(1)
    sixMonthsAgo.setHours(0, 0, 0, 0)

    const [
      usersByRole,
      ordersByStatus,
      totalRevenue,
      recentOrders,
      totalCreators,
      totalNetworks,
      totalBrands,
      monthlyOrders,
      monthlyRevenue,
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
      // Monthly order counts for the last 6 months
      prisma.order.findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true, status: true },
      }),
      // Monthly revenue for the last 6 months
      prisma.transaction.findMany({
        where: {
          status: "RELEASED",
          createdAt: { gte: sixMonthsAgo },
        },
        select: { createdAt: true, amount: true, platformFee: true },
      }),
    ])

    const userRoleCounts = usersByRole.reduce(
      (acc, item) => {
        if (item.role) acc[item.role] = item._count.id
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

    // Aggregate monthly orders
    const monthlyOrderData: Record<string, number> = {}
    for (const order of monthlyOrders) {
      const key = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, "0")}`
      monthlyOrderData[key] = (monthlyOrderData[key] || 0) + 1
    }

    // Aggregate monthly revenue
    const monthlyRevenueData: Record<string, { revenue: number; fees: number }> = {}
    for (const tx of monthlyRevenue) {
      const key = `${tx.createdAt.getFullYear()}-${String(tx.createdAt.getMonth() + 1).padStart(2, "0")}`
      if (!monthlyRevenueData[key]) monthlyRevenueData[key] = { revenue: 0, fees: 0 }
      monthlyRevenueData[key].revenue += tx.amount
      monthlyRevenueData[key].fees += tx.platformFee
    }

    // Build sorted monthly arrays for the last 6 months
    const months: string[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
    }

    const orderTrend = months.map((m) => ({
      month: m,
      orders: monthlyOrderData[m] || 0,
    }))

    const revenueTrend = months.map((m) => ({
      month: m,
      revenue: Math.round((monthlyRevenueData[m]?.revenue || 0) * 100) / 100,
      fees: Math.round((monthlyRevenueData[m]?.fees || 0) * 100) / 100,
    }))

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
      orderTrend,
      revenueTrend,
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
