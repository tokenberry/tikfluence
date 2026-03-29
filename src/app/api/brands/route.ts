import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") ?? ""

    const brands = await prisma.brand.findMany({
      where: search
        ? { companyName: { contains: search, mode: "insensitive" } }
        : {},
      select: {
        id: true,
        companyName: true,
        industry: true,
        user: { select: { name: true } },
      },
      take: 20,
      orderBy: { companyName: "asc" },
    })

    return NextResponse.json({ brands })
  } catch (error) {
    console.error("Error listing brands:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
