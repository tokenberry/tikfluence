import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { sendDeliverySubmittedEmail } from "@/lib/email"
import { createNotification } from "@/lib/notifications"
import { canDeliverOrder } from "@/lib/orders"
import { z } from "zod"

export const dynamic = "force-dynamic"

const deliverySchema = z.object({
  deliveryType: z.enum(["SHORT_VIDEO", "LIVE"]).default("SHORT_VIDEO"),
  tiktokLink: z.string().url(),
  tiktokLinks: z.array(z.string().url()).default([]),
  screenshotUrl: z.string().url().optional(),
  screenshots: z.array(z.string()).default([]),
  // SHORT_VIDEO metrics
  impressions: z.number().int().min(0).optional(),
  views: z.number().int().min(0).optional(),
  likes: z.number().int().min(0).optional(),
  comments: z.number().int().min(0).optional(),
  shares: z.number().int().min(0).optional(),
  // LIVE metrics
  streamDuration: z.number().int().min(1).optional(),
  peakViewers: z.number().int().min(0).optional(),
  avgConcurrentViewers: z.number().int().min(0).optional(),
  chatMessages: z.number().int().min(0).optional(),
  giftsValue: z.number().min(0).optional(),
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
        brand: { include: { user: { select: { id: true, email: true, name: true } } } },
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

    if (!canDeliverOrder(order.status)) {
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

    // Notify brand that delivery was submitted
    sendDeliverySubmittedEmail(
      order.brand.user.email,
      order.brand.user.name,
      order.title
    )

    // In-app notification to brand
    createNotification(
      order.brand.user.id,
      "delivery_submitted",
      "Delivery submitted",
      `A delivery has been submitted for "${order.title}"`,
      `/brand/orders/${id}`
    )

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("Error submitting delivery:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
