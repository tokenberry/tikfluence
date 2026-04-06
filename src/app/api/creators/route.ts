import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

export const dynamic = "force-dynamic"

const querySchema = z.object({
  category: z.string().optional(),
  tier: z.coerce.number().int().min(1).max(5).optional(),
  search: z.string().optional(),
  contentType: z.enum(["video", "live"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parsed = querySchema.safeParse({
      category: searchParams.get("category") ?? undefined,
      tier: searchParams.get("tier") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      contentType: searchParams.get("contentType") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    })

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { category, tier, search, contentType, page, limit } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (tier) {
      where.tier = tier
    }

    if (contentType === "video") {
      where.supportsShortVideo = true
    } else if (contentType === "live") {
      where.supportsLive = true
    }

    if (category) {
      where.categories = {
        some: {
          category: {
            slug: category,
          },
        },
      }
    }

    if (search) {
      where.OR = [
        { tiktokUsername: { contains: search, mode: "insensitive" } },
        { bio: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
      ]
    }

    const [creators, total] = await Promise.all([
      prisma.creator.findMany({
        where,
        skip,
        take: limit,
        orderBy: { score: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          categories: {
            include: {
              category: true,
            },
          },
        },
      }),
      prisma.creator.count({ where }),
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
    console.error("Error listing creators:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
