import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

export const dynamic = "force-dynamic"

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)

    const parsed = querySchema.safeParse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    })

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { page, limit } = parsed.data
    const skip = (page - 1) * limit

    const network = await prisma.creatorNetwork.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!network) {
      return NextResponse.json({ error: "Network not found" }, { status: 404 })
    }

    const [creators, total] = await Promise.all([
      prisma.creator.findMany({
        where: { networkId: id },
        skip,
        take: limit,
        orderBy: { score: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          categories: {
            include: { category: true },
          },
        },
      }),
      prisma.creator.count({ where: { networkId: id } }),
    ])

    return NextResponse.json({
      creators,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error listing network creators:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

const addCreatorSchema = z.object({
  creatorId: z.string().min(1),
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

    const network = await prisma.creatorNetwork.findUnique({
      where: { id },
      select: { id: true, userId: true },
    })

    if (!network) {
      return NextResponse.json({ error: "Network not found" }, { status: 404 })
    }

    if (network.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = addCreatorSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { creatorId } = parsed.data

    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
      select: { id: true, networkId: true },
    })

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 })
    }

    if (creator.networkId) {
      return NextResponse.json(
        { error: "Creator already belongs to a network" },
        { status: 409 }
      )
    }

    const updated = await prisma.creator.update({
      where: { id: creatorId },
      data: { networkId: id },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    })

    return NextResponse.json(updated, { status: 201 })
  } catch (error) {
    console.error("Error adding creator to network:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
