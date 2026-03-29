import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { sendOrderAcceptedEmail } from "@/lib/email"
import { createNotification } from "@/lib/notifications"

export const dynamic = "force-dynamic"

export const dynamic = "force-dynamic"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "CREATOR" && session.user.role !== "NETWORK") {
      return NextResponse.json(
        { error: "Only creators and networks can accept orders" },
        { status: 403 }
      )
    }

    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        brand: { include: { user: { select: { id: true, email: true, name: true } } } },
        _count: { select: { assignments: true } },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.status !== "OPEN") {
      return NextResponse.json(
        { error: "Order is not open for acceptance" },
        { status: 400 }
      )
    }

    if (order._count.assignments >= order.maxCreators) {
      return NextResponse.json(
        { error: "Maximum number of creators reached for this order" },
        { status: 400 }
      )
    }

    let creatorId: string | null = null
    let networkId: string | null = null

    if (session.user.role === "CREATOR") {
      const creator = await prisma.creator.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      })
      if (!creator) {
        return NextResponse.json({ error: "Creator profile not found" }, { status: 404 })
      }

      // Check if already assigned
      const existing = await prisma.orderAssignment.findFirst({
        where: { orderId: id, creatorId: creator.id },
      })
      if (existing) {
        return NextResponse.json({ error: "Already assigned to this order" }, { status: 409 })
      }

      creatorId = creator.id
    } else {
      const network = await prisma.creatorNetwork.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      })
      if (!network) {
        return NextResponse.json({ error: "Network profile not found" }, { status: 404 })
      }

      const existing = await prisma.orderAssignment.findFirst({
        where: { orderId: id, networkId: network.id },
      })
      if (existing) {
        return NextResponse.json({ error: "Already assigned to this order" }, { status: 409 })
      }

      networkId = network.id
    }

    const result = await prisma.$transaction(async (tx) => {
      const assignment = await tx.orderAssignment.create({
        data: {
          orderId: id,
          creatorId,
          networkId,
          status: "ASSIGNED",
        },
        include: {
          creator: {
            select: {
              id: true,
              tiktokUsername: true,
              user: { select: { name: true } },
            },
          },
          network: {
            select: { id: true, companyName: true },
          },
        },
      })

      await tx.order.update({
        where: { id },
        data: { status: "ASSIGNED" },
      })

      return assignment
    })

    // Notify brand that a creator/network accepted
    const creatorName =
      result.creator?.user?.name ??
      result.network?.companyName ??
      "A creator"
    sendOrderAcceptedEmail(
      order.brand.user.email,
      order.brand.user.name,
      order.title,
      creatorName
    )

    // In-app notification to brand
    createNotification(
      order.brand.user.id,
      "order_assigned",
      "Creator accepted your order",
      `${creatorName} has accepted "${order.title}"`,
      `/brand/orders/${id}`
    )

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("Error accepting order:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
