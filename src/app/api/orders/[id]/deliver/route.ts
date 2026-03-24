import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const deliverySchema = z.object({
  tiktokLink: z.string().url(),
  screenshotUrl: z.string().url().optional(),
  impressions: z.number().int().min(0).optional(),
  views: z.number().int().min(0).optional(),
  likes: z.number().int().min(0).optional(),
  comments: z.number().int().min(0).optional(),
  shares: z.number().int().min(0).optional(),
  notes: z.string().max(5000).optional(),
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

    // Verify the user is assigned to this order
    const isAssigned = order.assignments.some(
      (a) =>
        a.creator?.userId === session.user.id ||
        a.network?.userId === session.user.id
    )

    if (!isAssigned) {
      return NextResponse.json(
        { error: "You are not assigned to this order" },
        { status: 403 }
      )
    }

    if (!["ASSIGNED", "IN_PROGRESS", "REVISION"].includes(order.status)) {
      return NextResponse.json(
        { error: "Order is not in a deliverable state" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const parsed = deliverySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      const delivery = await tx.delivery.create({
        data: {
          orderId: id,
          ...parsed.data,
        },
      })

      await tx.order.update({
        where: { id },
        data: { status: "DELIVERED" },
      })

      return delivery
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("Error submitting delivery:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
