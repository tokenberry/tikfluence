import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

export const dynamic = "force-dynamic"

const querySchema = z.object({
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const parsed = querySchema.safeParse({
      status: searchParams.get("status") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    })

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { status, page, limit } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    }

    if (session.user.role === "BRAND") {
      const brand = await prisma.brand.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      })
      if (!brand) {
        return NextResponse.json({ error: "Brand profile not found" }, { status: 404 })
      }
      where.brandId = brand.id
    } else if (session.user.role === "CREATOR") {
      if (!status) {
        where.status = "OPEN"
      }
    } else if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          brand: {
            select: { id: true, companyName: true },
          },
          category: true,
          _count: {
            select: { assignments: true, deliveries: true },
          },
        },
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error listing orders:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

const createOrderSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  brief: z.string().max(10000).optional(),
  categoryId: z.string().min(1),
  type: z.enum(["SHORT_VIDEO", "LIVE", "COMBO"]).default("SHORT_VIDEO"),
  impressionTarget: z.number().int().min(0).default(0),
  budget: z.number().min(0).default(0),
  liveFlatFee: z.number().min(0).optional(),
  liveMinDuration: z.number().int().min(1).optional(),
  liveGuidelines: z.string().max(5000).optional(),
  maxCreators: z.number().int().min(1).default(1),
  deadline: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "BRAND") {
      return NextResponse.json({ error: "Only brands can create orders" }, { status: 403 })
    }

    const brand = await prisma.brand.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!brand) {
      return NextResponse.json({ error: "Brand profile not found" }, { status: 404 })
    }

    const body = await request.json()
    const parsed = createOrderSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { title, description, brief, categoryId, type, impressionTarget, budget, liveFlatFee, liveMinDuration, liveGuidelines, maxCreators, deadline } = parsed.data

    // Validate type-specific requirements
    if (type === "SHORT_VIDEO" && (impressionTarget <= 0 || budget <= 0)) {
      return NextResponse.json({ error: "Short Video orders require impressionTarget and budget" }, { status: 400 })
    }
    if (type === "LIVE" && (!liveFlatFee || liveFlatFee <= 0)) {
      return NextResponse.json({ error: "LIVE orders require a flat fee per stream" }, { status: 400 })
    }
    if (type === "COMBO") {
      if (impressionTarget <= 0 || budget <= 0) {
        return NextResponse.json({ error: "COMBO orders require impressionTarget and budget for the Short Video portion" }, { status: 400 })
      }
      if (!liveFlatFee || liveFlatFee <= 0) {
        return NextResponse.json({ error: "COMBO orders require a flat fee for the LIVE portion" }, { status: 400 })
      }
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    })

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    // CPM = (budget / impressionTarget) * 1000 — only relevant for SHORT_VIDEO/COMBO
    const cpmRate = impressionTarget > 0 ? (budget / impressionTarget) * 1000 : 0

    const order = await prisma.order.create({
      data: {
        brandId: brand.id,
        title,
        description,
        brief,
        categoryId,
        type,
        impressionTarget,
        budget,
        cpmRate,
        liveFlatFee: liveFlatFee ?? null,
        liveMinDuration: liveMinDuration ?? null,
        liveGuidelines: liveGuidelines ?? null,
        maxCreators,
        expiresAt: new Date(deadline),
        status: "DRAFT",
      },
      include: {
        brand: {
          select: { id: true, companyName: true },
        },
        category: true,
      },
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
