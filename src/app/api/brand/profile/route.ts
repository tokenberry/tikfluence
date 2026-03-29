import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

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
    const { companyName, website, industry, description } = body

    if (!companyName) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      )
    }

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
