import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { z } from "zod"

export const dynamic = "force-dynamic"

/**
 * Creator's persistent default shipping address (F3).
 *
 * Used as the pre-fill source when a creator confirms their address on an
 * assignment that requires physical product shipment. Updating the address
 * here does NOT rewrite history on past shipments — each OrderAssignment
 * already carries its own address snapshot from the moment the creator
 * confirmed it.
 *
 * GET  → returns the creator's saved address, or null if none exists yet.
 * PUT  → upsert the creator's saved address (full payload on every write;
 *        partial-edit UX is handled client-side).
 */

const addressSchema = z.object({
  fullName: z.string().min(1).max(120),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional().nullable(),
  city: z.string().min(1).max(100),
  state: z.string().max(100).optional().nullable(),
  postalCode: z.string().min(1).max(20),
  country: z
    .string()
    .length(2, "Use an ISO-2 country code (e.g. 'US')")
    .regex(/^[A-Za-z]{2}$/),
  phone: z.string().max(40).optional().nullable(),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const creator = await prisma.creator.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        shippingAddress: {
          select: {
            id: true,
            fullName: true,
            line1: true,
            line2: true,
            city: true,
            state: true,
            postalCode: true,
            country: true,
            phone: true,
            updatedAt: true,
          },
        },
      },
    })

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 })
    }

    return NextResponse.json({ address: creator.shippingAddress ?? null })
  } catch (error) {
    console.error("Error fetching creator shipping address:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const { success: allowed } = rateLimit(
      `creator-shipping-addr:${userId}`,
      RATE_LIMITS.api
    )
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      )
    }

    const body = await request.json()
    const parsed = addressSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid address", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const creator = await prisma.creator.findUnique({
      where: { userId },
      select: { id: true },
    })
    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 })
    }

    const { fullName, line1, line2, city, state, postalCode, country, phone } =
      parsed.data

    const normalizedCountry = country.toUpperCase()

    const address = await prisma.creatorShippingAddress.upsert({
      where: { creatorId: creator.id },
      create: {
        creatorId: creator.id,
        fullName,
        line1,
        line2: line2 ?? null,
        city,
        state: state ?? null,
        postalCode,
        country: normalizedCountry,
        phone: phone ?? null,
      },
      update: {
        fullName,
        line1,
        line2: line2 ?? null,
        city,
        state: state ?? null,
        postalCode,
        country: normalizedCountry,
        phone: phone ?? null,
      },
    })

    return NextResponse.json({ address })
  } catch (error) {
    console.error("Error updating creator shipping address:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
