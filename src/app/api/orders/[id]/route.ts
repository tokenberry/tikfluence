import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

export const dynamic = "force-dynamic"

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
              select: { id: true, companyName: true, user: { select: { id: true } } },
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

    // Authorization: only involved parties can view order details
    const userId = session.user.id
    const role = session.user.role
    const isBrandOwner = order.brand.userId === userId
    const isAssigned = order.assignments.some(
      (a) => a.creator?.user?.id === userId || a.network?.user?.id === userId
    )

    if (!isBrandOwner && !isAssigned && role !== "ADMIN" && role !== "ACCOUNT_MANAGER") {
      // Check if user is an agency managing this brand
      if (role === "AGENCY") {
        const agency = await prisma.agency.findUnique({ where: { userId } })
        const manages = agency
          ? await prisma.agencyBrand.findFirst({
              where: { agencyId: agency.id, brandId: order.brand.id },
            })
          : null
        if (!manages) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
      } else {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
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
        brand: { select: { id: true, userId: true } },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Allow brand owner or agency managing this brand
    let authorized = order.brand.userId === session.user.id
    if (!authorized && session.user.role === "AGENCY") {
      const agency = await prisma.agency.findUnique({ where: { userId: session.user.id } })
      if (agency) {
        const link = await prisma.agencyBrand.findFirst({
          where: { agencyId: agency.id, brandId: order.brand.id, status: "APPROVED" },
        })
        if (link) authorized = true
      }
    }
    if (!authorized) {
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
        brand: { select: { id: true, userId: true } },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    let canDelete = order.brand.userId === session.user.id || session.user.role === "ADMIN"
    if (!canDelete && session.user.role === "AGENCY") {
      const agency = await prisma.agency.findUnique({ where: { userId: session.user.id } })
      if (agency) {
        const link = await prisma.agencyBrand.findFirst({
          where: { agencyId: agency.id, brandId: order.brand.id, status: "APPROVED" },
        })
        if (link) canDelete = true
      }
    }
    if (!canDelete) {
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
