import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ACCOUNT_MANAGER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const accountManager = await prisma.accountManager.findUnique({
      where: { userId: session.user.id },
    })

    if (!accountManager) {
      return NextResponse.json({ error: "Account manager not found" }, { status: 404 })
    }

    const notes = await prisma.internalNote.findMany({
      where: { accountManagerId: accountManager.id },
      orderBy: { createdAt: "desc" },
      include: {
        brand: { select: { companyName: true } },
        agency: { select: { companyName: true } },
        creator: { select: { user: { select: { name: true } } } },
        order: { select: { title: true } },
      },
    })

    return NextResponse.json({ notes })
  } catch (error) {
    console.error("Error fetching internal notes:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

const createNoteSchema = z.object({
  content: z.string().min(1),
  brandId: z.string().optional(),
  agencyId: z.string().optional(),
  creatorId: z.string().optional(),
  orderId: z.string().optional(),
}).refine(
  (data) => data.brandId || data.agencyId || data.creatorId || data.orderId,
  { message: "At least one target (brandId, agencyId, creatorId, or orderId) must be set" }
)

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ACCOUNT_MANAGER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const accountManager = await prisma.accountManager.findUnique({
      where: { userId: session.user.id },
    })

    if (!accountManager) {
      return NextResponse.json({ error: "Account manager not found" }, { status: 404 })
    }

    const body = await request.json()
    const parsed = createNoteSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const note = await prisma.internalNote.create({
      data: {
        accountManagerId: accountManager.id,
        content: parsed.data.content,
        brandId: parsed.data.brandId,
        agencyId: parsed.data.agencyId,
        creatorId: parsed.data.creatorId,
        orderId: parsed.data.orderId,
      },
    })

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error("Error creating internal note:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
