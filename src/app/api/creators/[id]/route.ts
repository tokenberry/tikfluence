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
    const { id } = await params

    const creator = await prisma.creator.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        categories: {
          include: { category: true },
        },
        network: {
          select: { id: true, companyName: true },
        },
        orderAssignments: {
          include: {
            order: {
              select: {
                id: true,
                title: true,
                status: true,
                budget: true,
              },
            },
          },
          take: 10,
          orderBy: { acceptedAt: "desc" },
        },
      },
    })

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 })
    }

    return NextResponse.json(creator)
  } catch (error) {
    console.error("Error fetching creator:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

const updateSchema = z.object({
  bio: z.string().max(1000).optional(),
  portfolioLinks: z.array(z.string().url()).max(10).optional(),
  categories: z.array(z.string()).optional(),
  supportsShortVideo: z.boolean().optional(),
  supportsLive: z.boolean().optional(),
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

    const creator = await prisma.creator.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 })
    }

    if (creator.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = updateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { bio, portfolioLinks, categories, supportsShortVideo, supportsLive } = parsed.data

    const updateData: Record<string, unknown> = {}
    if (bio !== undefined) updateData.bio = bio
    if (portfolioLinks !== undefined) updateData.portfolioLinks = portfolioLinks
    if (supportsShortVideo !== undefined) updateData.supportsShortVideo = supportsShortVideo
    if (supportsLive !== undefined) updateData.supportsLive = supportsLive

    const updated = await prisma.$transaction(async (tx) => {
      if (categories !== undefined) {
        await tx.creatorCategory.deleteMany({ where: { creatorId: id } })
        if (categories.length > 0) {
          await tx.creatorCategory.createMany({
            data: categories.map((categoryId) => ({
              creatorId: id,
              categoryId,
            })),
          })
        }
      }

      return tx.creator.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          categories: {
            include: { category: true },
          },
        },
      })
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating creator:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
