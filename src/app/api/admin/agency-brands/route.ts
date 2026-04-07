import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { actorFromSession, recordAudit } from "@/lib/audit"
import { z } from "zod"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const agencyBrands = await prisma.agencyBrand.findMany({
      include: {
        agency: {
          select: { id: true, companyName: true, user: { select: { name: true, email: true } } },
        },
        brand: {
          select: { id: true, companyName: true, user: { select: { name: true, email: true } } },
        },
      },
      orderBy: { addedAt: "desc" },
    })

    return NextResponse.json({ agencyBrands })
  } catch (error) {
    console.error("Error listing agency brands:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

const updateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["APPROVED", "REJECTED"]),
})

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
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

    const before = await prisma.agencyBrand.findUnique({
      where: { id: parsed.data.id },
      include: {
        agency: { select: { companyName: true } },
        brand: { select: { companyName: true } },
      },
    })

    const updated = await prisma.agencyBrand.update({
      where: { id: parsed.data.id },
      data: { status: parsed.data.status },
    })

    const actor = actorFromSession(session.user)
    if (actor) {
      await recordAudit({
        actor,
        action:
          parsed.data.status === "APPROVED"
            ? "agency_brand.approve"
            : "agency_brand.reject",
        targetType: "AGENCY_BRAND",
        targetId: parsed.data.id,
        metadata: {
          before: { status: before?.status ?? null },
          after: { status: updated.status },
          agencyName: before?.agency.companyName ?? null,
          brandName: before?.brand.companyName ?? null,
        },
      })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating agency brand:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
