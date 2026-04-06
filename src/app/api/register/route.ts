import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendWelcomeEmail } from "@/lib/email"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.enum(["CREATOR", "NETWORK", "BRAND", "AGENCY"]),
  // Creator-specific
  tiktokUsername: z.string().optional(),
  supportsShortVideo: z.boolean().optional(),
  supportsLive: z.boolean().optional(),
  // Network-specific
  companyName: z.string().optional(),
  // Brand-specific
  brandCompanyName: z.string().optional(),
  industry: z.string().optional(),
  // Agency-specific
  agencyCompanyName: z.string().optional(),
  agencyWebsite: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown"
    const rl = rateLimit(`register:${ip}`, RATE_LIMITS.auth)
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      )
    }

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

    // Pre-validate creator-specific fields before creating user
    if (data.role === "CREATOR") {
      if (!data.tiktokUsername) {
        return NextResponse.json(
          { error: "TikTok username is required for creators" },
          { status: 400 }
        )
      }
      const existingCreator = await prisma.creator.findUnique({
        where: { tiktokUsername: data.tiktokUsername },
      })
      if (existingCreator) {
        return NextResponse.json(
          { error: "TikTok username already registered" },
          { status: 400 }
        )
      }
    }

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

        await tx.creator.create({
          data: {
            userId: newUser.id,
            tiktokUsername: data.tiktokUsername!,
            supportsShortVideo: data.supportsShortVideo ?? true,
            supportsLive: data.supportsLive ?? false,
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
      } else if (data.role === "AGENCY") {
        if (!data.agencyCompanyName) {
          throw new Error("Company name is required for agencies")
        }
        await tx.agency.create({
          data: {
            userId: newUser.id,
            companyName: data.agencyCompanyName,
            website: data.agencyWebsite,
          },
        })
      }

      return newUser
    })

    sendWelcomeEmail(data.email, data.name, data.role)

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
