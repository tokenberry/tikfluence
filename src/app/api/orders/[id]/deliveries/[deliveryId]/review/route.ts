import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

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
      include: { brand: true },
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

    await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        approved,
        rejectionReason: approved ? null : rejectionReason || null,
        reviewedAt: new Date(),
      },
    })

    if (approved) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "APPROVED" },
      })
    } else {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "REVISION" },
      })
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
