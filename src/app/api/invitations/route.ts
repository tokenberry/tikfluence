import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

/**
 * Creator-side invitation inbox (F4).
 *
 * `GET /api/invitations` lists every invitation addressed to the
 * authenticated creator, newest first. Defaults to `?status=PENDING`
 * but accepts `?status=ALL` to show historical responses too.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "CREATOR") {
      return NextResponse.json(
        { error: "Only creators have an invitations inbox." },
        { status: 403 }
      )
    }

    const creator = await prisma.creator.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!creator) {
      return NextResponse.json({ invitations: [] })
    }

    const { searchParams } = new URL(request.url)
    const statusParam = searchParams.get("status")
    const statusFilter =
      statusParam === "ALL" ? undefined : { status: "PENDING" as const }

    const invitations = await prisma.orderInvitation.findMany({
      where: {
        creatorId: creator.id,
        ...(statusFilter ?? {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        order: {
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            budget: true,
            cpmRate: true,
            impressionTarget: true,
            liveFlatFee: true,
            status: true,
            expiresAt: true,
            requiresShipping: true,
            productDescription: true,
            brand: {
              select: {
                companyName: true,
                logo: true,
                user: { select: { name: true } },
              },
            },
            category: { select: { name: true } },
          },
        },
        invitedByUser: { select: { id: true, name: true, role: true } },
      },
    })

    return NextResponse.json({ invitations })
  } catch (error) {
    console.error("Error listing invitations:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
