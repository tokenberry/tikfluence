import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends this header for cron jobs)
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const now = new Date()

    // Find OPEN orders past their expiration date
    const expiredOrders = await prisma.order.findMany({
      where: {
        status: { in: ["OPEN", "ASSIGNED"] },
        expiresAt: { lt: now, not: null },
      },
      include: {
        brand: {
          include: { user: { select: { id: true, email: true } } },
        },
      },
    })

    let cancelled = 0

    for (const order of expiredOrders) {
      await prisma.$transaction([
        prisma.order.update({
          where: { id: order.id },
          data: { status: "CANCELLED" },
        }),
        // Refund held payment if exists
        ...(order.paymentStatus === "HELD"
          ? [
              prisma.order.update({
                where: { id: order.id },
                data: { paymentStatus: "REFUNDED" },
              }),
            ]
          : []),
      ])

      cancelled++
    }

    return NextResponse.json({
      success: true,
      expired: cancelled,
      checked: expiredOrders.length,
    })
  } catch (error) {
    console.error("Cron expire-orders error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
