import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const disputeSchema = z.object({
  reason: z.string().min(1).max(5000),
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

    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        brand: { select: { userId: true } },
        assignments: {
          include: {
            creator: { select: { userId: true } },
            network: { select: { userId: true } },
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Only involved parties can dispute
    const isBrand = order.brand.userId === session.user.id
    const isAssigned = order.assignments.some(
      (a) =>
        a.creator?.userId === session.user.id ||
        a.network?.userId === session.user.id
    )
    const isAdmin = session.user.role === "ADMIN"

    if (!isBrand && !isAssigned && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (["DRAFT", "CANCELLED", "DISPUTED", "COMPLETED"].includes(order.status)) {
      return NextResponse.json(
        { error: "Cannot dispute an order in this status" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const parsed = disputeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // Create a support ticket for the dispute and update order status
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: { status: "DISPUTED" },
      })

      await tx.supportTicket.create({
        data: {
          creatorId: session.user.id,
          subject: `Dispute: Order ${order.title}`,
          description: parsed.data.reason,
          priority: 2,
        },
      })
    })

    return NextResponse.json({ message: "Dispute opened" })
  } catch (error) {
    console.error("Error opening dispute:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
