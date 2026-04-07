import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createPayout } from "@/lib/payoneer"
import { createNotification } from "@/lib/notifications"
import { actorFromSession, recordAudit } from "@/lib/audit"
import { z } from "zod"

export const dynamic = "force-dynamic"

const resolveSchema = z.object({
  resolution: z.enum(["release_to_creator", "credit_to_brand"]),
  notes: z.string().max(5000).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id: orderId } = await params

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        brand: { select: { id: true, userId: true } },
        assignments: {
          include: {
            creator: {
              select: {
                id: true,
                payoneerPayeeId: true,
                user: { select: { id: true, email: true, name: true } },
              },
            },
            network: {
              select: {
                id: true,
                payoneerPayeeId: true,
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

    if (order.status !== "DISPUTED") {
      return NextResponse.json(
        { error: "Order is not in disputed state" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const parsed = resolveSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { resolution, notes } = parsed.data
    const settings = await prisma.platformSettings.findUnique({
      where: { id: "default" },
    })
    const feeRate = settings?.platformFeeRate ?? 0.15

    if (resolution === "release_to_creator") {
      if (order.assignments.length === 0) {
        return NextResponse.json(
          { error: "No creators assigned to this order" },
          { status: 400 }
        )
      }

      // Pay each assigned creator their share
      const assignmentCount = order.assignments.length
      const perCreatorBudget = order.budget / assignmentCount
      const platformFee = perCreatorBudget * feeRate
      const creatorPayout = perCreatorBudget - platformFee

      const txRecords = await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: orderId },
          data: { status: "COMPLETED", paymentStatus: "HELD" },
        })

        const transactions = []
        for (const assignment of order.assignments) {
          const transaction = await tx.transaction.create({
            data: {
              orderId,
              amount: perCreatorBudget,
              platformFee,
              creatorPayout,
              stripePaymentId: order.stripePaymentId,
              payoutMethod: "PAYONEER",
              status: "PENDING",
            },
          })
          transactions.push({ transaction, assignment })
        }

        return transactions
      })

      // Attempt Payoneer payouts for each creator (non-blocking)
      for (const { transaction, assignment } of txRecords) {
        const payeeId =
          assignment.creator?.payoneerPayeeId ??
          assignment.network?.payoneerPayeeId
        if (payeeId) {
          try {
            const result = await createPayout({
              payeeId,
              amount: creatorPayout,
              description: `Dispute resolved — payout for "${order.title}"`,
              paymentId: transaction.id,
            })
            if (result.payoutId) {
              await prisma.transaction.update({
                where: { id: transaction.id },
                data: { payoneerPayoutId: result.payoutId, status: "RELEASED" },
              })
            }
          } catch (err) {
            console.error("Payoneer payout failed on dispute resolution:", err)
          }
        }

        // Notify each creator
        const assignee = assignment.creator ?? assignment.network
        if (assignee?.user) {
          createNotification(
            assignee.user.id,
            "dispute_resolved",
            "Dispute resolved in your favor",
            `The dispute for "${order.title}" has been resolved. Payout: $${creatorPayout.toFixed(2)}${notes ? `. Note: ${notes}` : ""}`,
            assignment.creator ? `/creator/orders/${orderId}` : `/network/orders/${orderId}`
          )
        }
      }

      // Update order payment status if any payouts succeeded
      const releasedCount = await prisma.transaction.count({
        where: { orderId, status: "RELEASED" },
      })
      if (releasedCount > 0) {
        await prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: "RELEASED" },
        })
      }

      // Notify brand
      createNotification(
        order.brand.userId,
        "dispute_resolved",
        "Dispute resolved",
        `The dispute for "${order.title}" has been resolved. Payment released to creator(s).${notes ? ` Note: ${notes}` : ""}`,
        `/brand/orders/${orderId}`
      )

      const actor = actorFromSession(session.user)
      if (actor) {
        await recordAudit({
          actor,
          action: "dispute.resolve",
          targetType: "ORDER",
          targetId: orderId,
          metadata: {
            resolution: "release_to_creator",
            orderTitle: order.title,
            assignmentCount,
            perCreatorBudget,
            platformFee,
            creatorPayout,
            notes: notes ?? null,
          },
        })
      }

      return NextResponse.json({ message: "Dispute resolved — payment released to creator(s)" })
    }

    // resolution === "credit_to_brand"
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED", paymentStatus: "REFUNDED" },
      })

      await tx.brandCredit.create({
        data: {
          brandId: order.brand.id,
          amount: order.budget,
          reason: `Dispute resolved — credit for "${order.title}"${notes ? `: ${notes}` : ""}`,
          orderId,
        },
      })
    })

    // Notify both parties
    createNotification(
      order.brand.userId,
      "dispute_resolved",
      "Dispute resolved — credit issued",
      `The dispute for "${order.title}" has been resolved. $${order.budget.toFixed(2)} credited to your account.${notes ? ` Note: ${notes}` : ""}`,
      `/brand/orders/${orderId}`
    )

    for (const assignment of order.assignments) {
      const assignee = assignment.creator ?? assignment.network
      if (assignee?.user) {
        createNotification(
          assignee.user.id,
          "dispute_resolved",
          "Dispute resolved",
          `The dispute for "${order.title}" has been resolved. Payment returned to brand.${notes ? ` Note: ${notes}` : ""}`,
          assignment.creator ? `/creator/orders/${orderId}` : `/network/orders/${orderId}`
        )
      }
    }

    const actor = actorFromSession(session.user)
    if (actor) {
      await recordAudit({
        actor,
        action: "dispute.resolve",
        targetType: "ORDER",
        targetId: orderId,
        metadata: {
          resolution: "credit_to_brand",
          orderTitle: order.title,
          creditAmount: order.budget,
          notes: notes ?? null,
        },
      })
    }

    return NextResponse.json({ message: "Dispute resolved — credit issued to brand" })
  } catch (error) {
    console.error("Error resolving dispute:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
