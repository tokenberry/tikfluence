import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "NETWORK") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { creatorId } = body

    if (!creatorId) {
      return NextResponse.json(
        { error: "Creator ID is required" },
        { status: 400 }
      )
    }

    const network = await prisma.creatorNetwork.findUnique({
      where: { userId: session.user.id },
    })

    if (!network) {
      return NextResponse.json(
        { error: "Network profile not found" },
        { status: 404 }
      )
    }

    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
    })

    if (!creator) {
      return NextResponse.json(
        { error: "Creator not found" },
        { status: 404 }
      )
    }

    if (creator.networkId) {
      return NextResponse.json(
        { error: "Creator already belongs to a network" },
        { status: 400 }
      )
    }

    await prisma.creator.update({
      where: { id: creatorId },
      data: { networkId: network.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error adding creator to network:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
