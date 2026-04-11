import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { sendOrderAcceptedEmail } from "@/lib/email"
import { createNotification } from "@/lib/notifications"

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

    let creatorId: string | null = null
    let networkId: string | null = null

    if (session.user.role === "CREATOR") {
      const creator = await prisma.creator.findUnique({
        where: { userId: session.user.id },
        select: { id: true, supportsShortVideo: true, supportsLive: true },
      })
      if (!creator) {
        return NextResponse.json({ error: "Creator profile not found" }, { status: 404 })
      }

      // Check content type compatibility
      const orderType = order.type
      if (orderType === "LIVE" && !creator.supportsLive) {
        return NextResponse.json(
          { error: "You cannot accept LIVE orders because your profile does not support LIVE streams" },
          { status: 403 }
        )
      }
      if (orderType === "SHORT_VIDEO" && !creator.supportsShortVideo) {
        return NextResponse.json(
          { error: "You cannot accept Short Video orders because your profile does not support Short Videos" },
          { status: 403 }
        )
      }
      if (orderType === "COMBO" && (!creator.supportsLive || !creator.supportsShortVideo)) {
        return NextResponse.json(
          { error: "You cannot accept Combo orders because your profile must support both Short Video and LIVE streams" },
          { status: 403 }
        )
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

      networkId = network.id
    }

    // All checks inside transaction to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // Re-check assignment count atomically
      const currentCount = await tx.orderAssignment.count({
        where: { orderId: id },
      })
      if (currentCount >= order.maxCreators) {
        throw new Error("MAX_CREATORS_REACHED")
      }

      // Check if already assigned (inside transaction)
      const existing = await tx.orderAssignment.findFirst({
        where: {
          orderId: id,
          ...(creatorId ? { creatorId } : { networkId }),
        },
      })
      if (existing) {
        throw new Error("ALREADY_ASSIGNED")
      }

      const assignment = await tx.orderAssignment.create({
        data: {
          orderId: id,
          creatorId,
          networkId,
          status: "ASSIGNED",
          // F3: orders that require physical product shipment start the
          // shipping state machine at PENDING_ADDRESS so the creator knows
          // they need to confirm their shipping address before the brand
          // can ship.
          shippingStatus: order.requiresShipping
            ? "PENDING_ADDRESS"
            : "NOT_REQUIRED",
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
    }).catch((err) => {
      if (err.message === "MAX_CREATORS_REACHED") {
        return { error: "Maximum number of creators reached for this order", status: 400 } as const
      }
      if (err.message === "ALREADY_ASSIGNED") {
        return { error: "Already assigned to this order", status: 409 } as const
      }
      throw err
    })

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

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
