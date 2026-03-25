import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.enum(["CREATOR", "NETWORK", "BRAND"]),
  // Creator-specific
  tiktokUsername: z.string().optional(),
  // Network-specific
  companyName: z.string().optional(),
  // Brand-specific
  brandCompanyName: z.string().optional(),
  industry: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = registerSchema.parse(body)

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    })
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(data.password, 12)

    // Create user with role-specific profile in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          name: data.name,
          role: data.role,
        },
      })

      if (data.role === "CREATOR") {
        if (!data.tiktokUsername) {
          throw new Error("TikTok username is required for creators")
        }

        // Check if TikTok username already taken
        const existingCreator = await tx.creator.findUnique({
          where: { tiktokUsername: data.tiktokUsername },
        })
        if (existingCreator) {
          throw new Error("TikTok username already registered")
        }

        await tx.creator.create({
          data: {
            userId: newUser.id,
            tiktokUsername: data.tiktokUsername,
          },
        })
      } else if (data.role === "NETWORK") {
        if (!data.companyName) {
          throw new Error("Company name is required for networks")
        }
        await tx.creatorNetwork.create({
          data: {
            userId: newUser.id,
            companyName: data.companyName,
          },
        })
      } else if (data.role === "BRAND") {
        if (!data.brandCompanyName) {
          throw new Error("Company name is required for brands")
        }
        await tx.brand.create({
          data: {
            userId: newUser.id,
            companyName: data.brandCompanyName,
            industry: data.industry,
          },
        })
      }

      return newUser
    })

    return NextResponse.json(
      { message: "Registration successful", userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }
    const message = error instanceof Error ? error.message : "Registration failed"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
