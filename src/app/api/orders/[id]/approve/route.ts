import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createTransfer } from "@/lib/stripe"
import { z } from "zod"

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
            creator: { select: { id: true, stripeAccountId: true } },
            network: { select: { id: true, stripeAccountId: true } },
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
            status: "APPROVED",
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
