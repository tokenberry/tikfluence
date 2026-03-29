import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

export const dynamic = "force-dynamic"

const querySchema = z.object({
  type: z.enum(["brand", "agency"]),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ACCOUNT_MANAGER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)

    const parsed = querySchema.safeParse({
      type: searchParams.get("type"),
    })

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const accountManager = await prisma.accountManager.findUnique({
      where: { userId: session.user.id },
    })

    if (!accountManager) {
      return NextResponse.json({ error: "Account manager not found" }, { status: 404 })
    }

    const { type } = parsed.data

    if (type === "brand") {
      // Verify assignment
      const assignment = await prisma.accountManagerBrand.findFirst({
        where: { accountManagerId: accountManager.id, brandId: id },
      })

      if (!assignment) {
        return NextResponse.json({ error: "Brand not assigned to you" }, { status: 403 })
      }

      const brand = await prisma.brand.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, name: true, email: true } },
          orders: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      })

      if (!brand) {
        return NextResponse.json({ error: "Brand not found" }, { status: 404 })
      }

      const internalNotes = await prisma.internalNote.findMany({
        where: { accountManagerId: accountManager.id, brandId: id },
        orderBy: { createdAt: "desc" },
      })

      return NextResponse.json({ client: { ...brand, internalNotes }, type: "brand" })
    } else {
      // agency
      const assignment = await prisma.accountManagerAgency.findFirst({
        where: { accountManagerId: accountManager.id, agencyId: id },
      })

      if (!assignment) {
        return NextResponse.json({ error: "Agency not assigned to you" }, { status: 403 })
      }

      const agency = await prisma.agency.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, name: true, email: true } },
          managedBrands: true,
        },
      })

      if (!agency) {
        return NextResponse.json({ error: "Agency not found" }, { status: 404 })
      }

      const internalNotes = await prisma.internalNote.findMany({
        where: { accountManagerId: accountManager.id, agencyId: id },
        orderBy: { createdAt: "desc" },
      })

      return NextResponse.json({ client: { ...agency, internalNotes }, type: "agency" })
    }
  } catch (error) {
    console.error("Error fetching client detail:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
