import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

export const dynamic = "force-dynamic"

const assignSchema = z.object({
  brandId: z.string().optional(),
  agencyId: z.string().optional(),
  priority: z.number().int().min(0).optional(),
}).refine(
  (data) => data.brandId || data.agencyId,
  { message: "Either brandId or agencyId must be provided" }
)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params

    const accountManager = await prisma.accountManager.findUnique({
      where: { id },
    })

    if (!accountManager) {
      return NextResponse.json({ error: "Account manager not found" }, { status: 404 })
    }

    const body = await request.json()
    const parsed = assignSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { brandId, agencyId, priority } = parsed.data

    if (brandId) {
      const existing = await prisma.accountManagerBrand.findFirst({
        where: { accountManagerId: id, brandId },
      })
      if (existing) {
        return NextResponse.json(
          { error: "Brand is already assigned to this account manager" },
          { status: 409 }
        )
      }
      const assignment = await prisma.accountManagerBrand.create({
        data: {
          accountManagerId: id,
          brandId,
          priority: priority ?? 0,
        },
      })
      return NextResponse.json(assignment, { status: 201 })
    }

    if (agencyId) {
      const existing = await prisma.accountManagerAgency.findFirst({
        where: { accountManagerId: id, agencyId },
      })
      if (existing) {
        return NextResponse.json(
          { error: "Agency is already assigned to this account manager" },
          { status: 409 }
        )
      }
      const assignment = await prisma.accountManagerAgency.create({
        data: {
          accountManagerId: id,
          agencyId,
          priority: priority ?? 0,
        },
      })
      return NextResponse.json(assignment, { status: 201 })
    }

    return NextResponse.json({ error: "No target specified" }, { status: 400 })
  } catch (error) {
    console.error("Error assigning client:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

const unassignSchema = z.object({
  brandId: z.string().optional(),
  agencyId: z.string().optional(),
}).refine(
  (data) => data.brandId || data.agencyId,
  { message: "Either brandId or agencyId must be provided" }
)

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params

    const accountManager = await prisma.accountManager.findUnique({
      where: { id },
    })

    if (!accountManager) {
      return NextResponse.json({ error: "Account manager not found" }, { status: 404 })
    }

    const body = await request.json()
    const parsed = unassignSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { brandId, agencyId } = parsed.data

    if (brandId) {
      await prisma.accountManagerBrand.deleteMany({
        where: { accountManagerId: id, brandId },
      })
      return NextResponse.json({ message: "Brand unassigned" })
    }

    if (agencyId) {
      await prisma.accountManagerAgency.deleteMany({
        where: { accountManagerId: id, agencyId },
      })
      return NextResponse.json({ message: "Agency unassigned" })
    }

    return NextResponse.json({ error: "No target specified" }, { status: 400 })
  } catch (error) {
    console.error("Error unassigning client:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
