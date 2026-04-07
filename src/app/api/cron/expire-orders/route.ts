import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") ?? undefined
  const log = logger.child({
    route: "api/cron/expire-orders",
    ...(requestId ? { requestId } : {}),
  })

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

    log.info(
      {
        event: "cron_expire_orders_complete",
        checked: expiredOrders.length,
        cancelled,
      },
      "Cron expire-orders batch finished"
    )

    return NextResponse.json({
      success: true,
      expired: cancelled,
      checked: expiredOrders.length,
    })
  } catch (error) {
    log.error(
      { event: "cron_expire_orders_error", err: error },
      "Cron expire-orders crashed"
    )
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
