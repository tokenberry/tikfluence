import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const updateBrandSchema = z.object({
  companyName: z.string().min(1).max(200),
  website: z.string().url().max(500).optional().or(z.literal("")),
  industry: z.string().max(100).optional().or(z.literal("")),
  description: z.string().max(5000).optional().or(z.literal("")),
})

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "BRAND") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const brand = await prisma.brand.findUnique({
      where: { userId: session.user.id },
      select: {
        companyName: true,
        website: true,
        industry: true,
        description: true,
      },
    })

    return NextResponse.json({ brand })
  } catch (error) {
    console.error("Error fetching brand profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "BRAND") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = updateBrandSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { companyName, website, industry, description } = parsed.data

    const brand = await prisma.brand.update({
      where: { userId: session.user.id },
      data: {
        companyName,
        website: website || null,
        industry: industry || null,
        description: description || null,
      },
    })

    return NextResponse.json({ brand })
  } catch (error) {
    console.error("Error updating brand profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
