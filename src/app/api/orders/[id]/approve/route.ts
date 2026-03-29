import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createTransfer } from "@/lib/stripe"
import { sendOrderApprovedEmail, sendOrderRejectedEmail } from "@/lib/email"
import { createNotification } from "@/lib/notifications"
import { analyzeDelivery } from "@/lib/ai"
import { z } from "zod"

export const dynamic = "force-dynamic"

const approveSchema = z.object({
  approved: z.boolean(),
  rejectionReason: z.string().max(2000).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "BRAND" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        brand: { select: { userId: true } },
        deliveries: {
          orderBy: { submittedAt: "desc" },
          take: 1,
        },
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

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.brand.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (order.status !== "DELIVERED") {
      return NextResponse.json(
        { error: "Order has not been delivered yet" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const parsed = approveSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { approved, rejectionReason } = parsed.data
    const latestDelivery = order.deliveries[0]

    if (!latestDelivery) {
      return NextResponse.json({ error: "No delivery found" }, { status: 400 })
    }

    if (approved) {
      // Update delivery as approved
      await prisma.delivery.update({
        where: { id: latestDelivery.id },
        data: { approved: true, reviewedAt: new Date() },
      })

      // Get platform fee settings
      const settings = await prisma.platformSettings.findUnique({
        where: { id: "default" },
      })
      const feeRate = settings?.platformFeeRate ?? 0.15
      const platformFee = order.budget * feeRate
      const creatorPayout = order.budget - platformFee

      // Try to release payment to creator/network
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

      // Update order and create transaction
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id },
          data: {
            status: "COMPLETED",
            paymentStatus: stripeTransferId ? "RELEASED" : "HELD",
          },
        })

        await tx.transaction.create({
          data: {
            orderId: id,
            amount: order.budget,
            platformFee,
            creatorPayout,
            stripePaymentId: order.stripePaymentId,
            stripeTransferId,
            status: stripeTransferId ? "RELEASED" : "PENDING",
          },
        })

        await tx.orderAssignment.updateMany({
          where: { orderId: id },
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
          assignment?.creator ? `/creator/orders/${id}` : `/network/orders/${id}`
        )
      }

      // Trigger async AI delivery analysis (non-blocking)
      const creatorProfile = assignment?.creator
      if (creatorProfile) {
        const creatorDetails = await prisma.creator.findUnique({
          where: { id: creatorProfile.id },
          select: { tiktokUsername: true, followerCount: true, engagementRate: true },
        })
        if (creatorDetails) {
          analyzeDelivery({
            orderId: id,
            deliveryId: latestDelivery.id,
            orderTitle: order.title,
            orderDescription: order.description,
            orderBrief: order.brief,
            orderType: order.type,
            impressionTarget: order.impressionTarget,
            budget: order.budget,
            cpmRate: order.cpmRate,
            liveFlatFee: order.liveFlatFee,
            liveMinDuration: order.liveMinDuration,
            deliveryType: latestDelivery.deliveryType,
            impressions: latestDelivery.impressions,
            views: latestDelivery.views,
            likes: latestDelivery.likes,
            comments: latestDelivery.comments,
            shares: latestDelivery.shares,
            streamDuration: latestDelivery.streamDuration,
            peakViewers: latestDelivery.peakViewers,
            avgConcurrentViewers: latestDelivery.avgConcurrentViewers,
            chatMessages: latestDelivery.chatMessages,
            giftsValue: latestDelivery.giftsValue,
            creatorUsername: creatorDetails.tiktokUsername,
            creatorFollowers: creatorDetails.followerCount,
            creatorEngagementRate: creatorDetails.engagementRate,
          }).catch((err) => console.error("AI delivery analysis failed:", err))
        }
      }

      return NextResponse.json({ message: "Order approved and payment released" })
    } else {
      // Rejection
      await prisma.$transaction(async (tx) => {
        await tx.delivery.update({
          where: { id: latestDelivery.id },
          data: {
            approved: false,
            rejectionReason,
            reviewedAt: new Date(),
          },
        })

        await tx.order.update({
          where: { id },
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
          assignment?.creator ? `/creator/orders/${id}` : `/network/orders/${id}`
        )
      }

      return NextResponse.json({ message: "Delivery rejected, revision requested" })
    }
  } catch (error) {
    console.error("Error approving/rejecting order:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
