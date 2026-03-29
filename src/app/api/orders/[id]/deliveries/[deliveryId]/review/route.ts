import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createTransfer } from "@/lib/stripe"
import { sendOrderApprovedEmail, sendOrderRejectedEmail } from "@/lib/email"
import { createNotification } from "@/lib/notifications"
import { analyzeDelivery } from "@/lib/ai"
import { z } from "zod"

const reviewSchema = z.object({
  approved: z.boolean(),
  rejectionReason: z.string().max(5000).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; deliveryId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || !session.user.role || !["BRAND", "AGENCY"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: orderId, deliveryId } = await params

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        brand: { select: { id: true, userId: true } },
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

    // Verify authorization: brand owner or managing agency
    let canReview = order.brand.userId === session.user.id
    if (!canReview && session.user.role === "AGENCY") {
      const agency = await prisma.agency.findUnique({ where: { userId: session.user.id } })
      if (agency) {
        const link = await prisma.agencyBrand.findFirst({
          where: { agencyId: agency.id, brandId: order.brand.id, status: "APPROVED" },
        })
        if (link) canReview = true
      }
    }
    if (!canReview) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
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
    const parsed = reviewSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { approved, rejectionReason } = parsed.data

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
      // Trigger async AI delivery analysis (non-blocking)
      const creatorProfile = assignment?.creator
      if (creatorProfile) {
        const creatorDetails = await prisma.creator.findUnique({
          where: { id: creatorProfile.id },
          select: { tiktokUsername: true, followerCount: true, engagementRate: true },
        })
        if (creatorDetails) {
          analyzeDelivery({
            orderId,
            deliveryId,
            orderTitle: order.title,
            orderDescription: order.description,
            orderBrief: order.brief,
            orderType: order.type,
            impressionTarget: order.impressionTarget,
            budget: order.budget,
            cpmRate: order.cpmRate,
            liveFlatFee: order.liveFlatFee,
            liveMinDuration: order.liveMinDuration,
            deliveryType: delivery.deliveryType,
            impressions: delivery.impressions,
            views: delivery.views,
            likes: delivery.likes,
            comments: delivery.comments,
            shares: delivery.shares,
            streamDuration: delivery.streamDuration,
            peakViewers: delivery.peakViewers,
            avgConcurrentViewers: delivery.avgConcurrentViewers,
            chatMessages: delivery.chatMessages,
            giftsValue: delivery.giftsValue,
            creatorUsername: creatorDetails.tiktokUsername,
            creatorFollowers: creatorDetails.followerCount,
            creatorEngagementRate: creatorDetails.engagementRate,
          }).catch((err) => console.error("AI delivery analysis failed:", err))
        }
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
