import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createTransfer } from "@/lib/stripe"
import { sendOrderApprovedEmail, sendOrderRejectedEmail } from "@/lib/email"
import { createNotification } from "@/lib/notifications"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; deliveryId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "BRAND") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: orderId, deliveryId } = await params

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        brand: { select: { userId: true } },
        assignments: {
          include: {
            creator: {
              select: {
                id: true,
                stripeAccountId: true,
                user: { select: { id: true, email: true, name: true } },
              },
            },
            network: {
              select: {
                id: true,
                stripeAccountId: true,
                user: { select: { id: true, email: true, name: true } },
              },
            },
          },
        },
      },
    })

    if (!order || order.brand.userId !== session.user.id) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
    })

    if (!delivery || delivery.orderId !== orderId) {
      return NextResponse.json(
        { error: "Delivery not found" },
        { status: 404 }
      )
    }

    if (delivery.approved !== null) {
      return NextResponse.json(
        { error: "Delivery has already been reviewed" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { approved, rejectionReason } = body

    if (approved) {
      // Get platform fee settings
      const settings = await prisma.platformSettings.findUnique({
        where: { id: "default" },
      })
      const feeRate = settings?.platformFeeRate ?? 0.15
      const platformFee = order.budget * feeRate
      const creatorPayout = order.budget - platformFee

      const assignment = order.assignments[0]
      const stripeAccountId =
        assignment?.creator?.stripeAccountId ??
        assignment?.network?.stripeAccountId

      let stripeTransferId: string | undefined

      if (stripeAccountId && order.stripePaymentId) {
        try {
          const transfer = await createTransfer(
            creatorPayout,
            stripeAccountId,
            `order_${order.id}`
          )
          stripeTransferId = transfer.id
        } catch (err) {
          console.error("Failed to create transfer:", err)
        }
      }

      await prisma.$transaction(async (tx) => {
        await tx.delivery.update({
          where: { id: deliveryId },
          data: { approved: true, reviewedAt: new Date() },
        })

        await tx.order.update({
          where: { id: orderId },
          data: {
            status: "COMPLETED",
            paymentStatus: stripeTransferId ? "RELEASED" : "HELD",
          },
        })

        await tx.transaction.create({
          data: {
            orderId,
            amount: order.budget,
            platformFee,
            creatorPayout,
            stripePaymentId: order.stripePaymentId,
            stripeTransferId,
            status: stripeTransferId ? "RELEASED" : "PENDING",
          },
        })

        await tx.orderAssignment.updateMany({
          where: { orderId },
          data: { completedAt: new Date() },
        })
      })

      // Notify creator/network of approval
      const assignee = assignment?.creator ?? assignment?.network
      if (assignee?.user) {
        sendOrderApprovedEmail(
          assignee.user.email,
          assignee.user.name,
          order.title,
          creatorPayout
        )
        createNotification(
          assignee.user.id,
          "delivery_approved",
          "Delivery approved!",
          `Your delivery for "${order.title}" was approved. Payout: $${creatorPayout.toFixed(2)}`,
          assignment?.creator ? `/creator/orders/${orderId}` : `/network/orders/${orderId}`
        )
      }
    } else {
      await prisma.$transaction(async (tx) => {
        await tx.delivery.update({
          where: { id: deliveryId },
          data: {
            approved: false,
            rejectionReason: rejectionReason || null,
            reviewedAt: new Date(),
          },
        })

        await tx.order.update({
          where: { id: orderId },
          data: { status: "REVISION" },
        })
      })

      // Notify creator/network of rejection
      const assignment = order.assignments[0]
      const rejectedAssignee = assignment?.creator ?? assignment?.network
      if (rejectedAssignee?.user) {
        sendOrderRejectedEmail(
          rejectedAssignee.user.email,
          rejectedAssignee.user.name,
          order.title,
          rejectionReason
        )
        createNotification(
          rejectedAssignee.user.id,
          "delivery_rejected",
          "Revision requested",
          `The brand requested a revision for "${order.title}"${rejectionReason ? `: ${rejectionReason}` : ""}`,
          assignment?.creator ? `/creator/orders/${orderId}` : `/network/orders/${orderId}`
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error reviewing delivery:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
