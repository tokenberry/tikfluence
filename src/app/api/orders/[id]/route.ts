import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

export async function GET(
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
        brand: {
          select: { id: true, companyName: true, userId: true },
        },
        category: true,
        assignments: {
          include: {
            creator: {
              select: {
                id: true,
                tiktokUsername: true,
                user: { select: { id: true, name: true } },
              },
            },
            network: {
              select: { id: true, companyName: true },
            },
          },
        },
        deliveries: {
          orderBy: { submittedAt: "desc" },
        },
        transactions: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error("Error fetching order:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

const updateOrderSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
  brief: z.string().max(10000).optional(),
  categoryId: z.string().min(1).optional(),
  impressionTarget: z.number().int().min(1).optional(),
  budget: z.number().min(0).optional(),
  maxCreators: z.number().int().min(1).optional(),
  status: z.enum(["DRAFT", "OPEN"]).optional(),
})

export async function PUT(
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
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.brand.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (order.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only draft orders can be updated" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const parsed = updateOrderSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Recalculate CPM if budget or impressionTarget changed
    if (data.budget !== undefined || data.impressionTarget !== undefined) {
      const budget = data.budget ?? order.budget
      const impressionTarget = data.impressionTarget ?? order.impressionTarget
      ;(data as Record<string, unknown>).cpmRate = (budget / impressionTarget) * 1000
    }

    const updated = await prisma.order.update({
      where: { id },
      data,
      include: {
        brand: { select: { id: true, companyName: true } },
        category: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.brand.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.order.update({
      where: { id },
      data: { status: "CANCELLED" },
    })

    return NextResponse.json({ message: "Order cancelled" })
  } catch (error) {
    console.error("Error cancelling order:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
