import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "AGENCY") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const agency = await prisma.agency.findUnique({
      where: { userId: session.user.id },
    })

    if (!agency) {
      return NextResponse.json({ error: "Agency profile not found" }, { status: 404 })
    }

    const agencyCreators = await prisma.agencyCreator.findMany({
      where: { agencyId: agency.id },
      include: {
        creator: {
          select: {
            id: true,
            followerCount: true,
            avgViews: true,
            score: true,
            tier: true,
            supportsLive: true,
            supportsShortVideo: true,
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
    })

    return NextResponse.json({ creators: agencyCreators })
  } catch (error) {
    console.error("Error listing agency creators:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

const addCreatorSchema = z.object({
  creatorId: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "AGENCY") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const agency = await prisma.agency.findUnique({
      where: { userId: session.user.id },
    })

    if (!agency) {
      return NextResponse.json({ error: "Agency profile not found" }, { status: 404 })
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
    })

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 })
    }

    const existing = await prisma.agencyCreator.findFirst({
      where: { agencyId: agency.id, creatorId },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Creator is already managed by this agency" },
        { status: 409 }
      )
    }

    const agencyCreator = await prisma.agencyCreator.create({
      data: {
        agencyId: agency.id,
        creatorId,
      },
    })

    return NextResponse.json(agencyCreator, { status: 201 })
  } catch (error) {
    console.error("Error adding creator to agency:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
