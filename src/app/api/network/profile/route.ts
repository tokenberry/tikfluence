import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "NETWORK") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const network = await prisma.creatorNetwork.findUnique({
      where: { userId: session.user.id },
      select: {
        companyName: true,
        website: true,
        description: true,
      },
    })

    return NextResponse.json({ network })
  } catch (error) {
    console.error("Error fetching network profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

const updateSchema = z.object({
  companyName: z.string().min(1).max(200),
  website: z.string().url().max(500).optional().or(z.literal("")),
  description: z.string().max(5000).optional().or(z.literal("")),
})

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "NETWORK") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = updateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { companyName, website, description } = parsed.data

    const network = await prisma.creatorNetwork.update({
      where: { userId: session.user.id },
      data: {
        companyName,
        website: website || null,
        description: description || null,
      },
    })

    return NextResponse.json({ network })
  } catch (error) {
    console.error("Error updating network profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
