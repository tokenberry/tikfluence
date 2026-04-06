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

    const agencyBrands = await prisma.agencyBrand.findMany({
      where: { agencyId: agency.id },
      include: {
        brand: {
          select: {
            id: true,
            companyName: true,
            industry: true,
            user: {
              select: { name: true, email: true },
            },
            _count: {
              select: { orders: true },
            },
          },
        },
      },
    })

    return NextResponse.json({ brands: agencyBrands })
  } catch (error) {
    console.error("Error listing agency brands:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

const addBrandSchema = z.object({
  brandId: z.string().min(1).optional(),
  createBrand: z.boolean().optional(),
  companyName: z.string().min(1).max(200).optional(),
  industry: z.string().max(100).optional(),
  website: z.string().max(500).optional(),
  description: z.string().max(2000).optional(),
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
    const parsed = addBrandSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { brandId, createBrand, companyName, industry, website, description } = parsed.data

    // Create a new brand owned by the agency
    if (createBrand) {
      if (!companyName) {
        return NextResponse.json({ error: "Company name is required" }, { status: 400 })
      }

      const placeholderEmail = `brand-${Date.now()}@agency-managed.foxolog.com`
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: placeholderEmail,
            name: companyName,
            role: "BRAND",
          },
        })
        const brand = await tx.brand.create({
          data: {
            userId: user.id,
            companyName,
            industry: industry || null,
            website: website || null,
            description: description || null,
          },
        })
        const agencyBrand = await tx.agencyBrand.create({
          data: {
            agencyId: agency.id,
            brandId: brand.id,
            status: "APPROVED",
          },
        })
        return { brand, agencyBrand }
      })

      return NextResponse.json(
        { ...result.agencyBrand, brand: result.brand, message: "Brand created and added to your account." },
        { status: 201 }
      )
    }

    // Request to manage an existing brand
    if (!brandId) {
      return NextResponse.json({ error: "Brand ID is required" }, { status: 400 })
    }

    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
    })

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 })
    }

    const existing = await prisma.agencyBrand.findFirst({
      where: { agencyId: agency.id, brandId },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Brand is already managed by this agency" },
        { status: 409 }
      )
    }

    const agencyBrand = await prisma.agencyBrand.create({
      data: {
        agencyId: agency.id,
        brandId,
        status: "PENDING",
      },
    })

    return NextResponse.json(
      { ...agencyBrand, message: "Brand claim submitted. Awaiting admin approval." },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error adding brand to agency:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
