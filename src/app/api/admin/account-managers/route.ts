import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"
import bcrypt from "bcryptjs"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const accountManagers = await prisma.accountManager.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            isActive: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            assignedBrands: true,
            assignedAgencies: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ accountManagers })
  } catch (error) {
    console.error("Error listing account managers:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  department: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = createSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { email, password, name, department } = parsed.data

    const existing = await prisma.user.findUnique({
      where: { email },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: "ACCOUNT_MANAGER",
        },
      })

      const accountManager = await tx.accountManager.create({
        data: {
          userId: user.id,
          department,
        },
      })

      return { user, accountManager }
    })

    return NextResponse.json(
      {
        message: "Account manager created",
        userId: result.user.id,
        accountManagerId: result.accountManager.id,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating account manager:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
