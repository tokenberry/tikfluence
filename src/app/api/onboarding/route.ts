import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { sendWelcomeEmail } from "@/lib/email"
import { z } from "zod"

export const dynamic = "force-dynamic"

const onboardingSchema = z.object({
  role: z.enum(["CREATOR", "NETWORK", "BRAND", "AGENCY"]),
  tiktokUsername: z.string().optional(),
  supportsShortVideo: z.boolean().optional(),
  supportsLive: z.boolean().optional(),
  companyName: z.string().optional(),
  industry: z.string().optional(),
  agencyWebsite: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only allow onboarding for users without a role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role) {
      return NextResponse.json(
        { error: "Profile already completed" },
        { status: 400 }
      )
    }

    const body = await req.json()
    const data = onboardingSchema.parse(body)

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: session.user.id },
        data: { role: data.role },
      })

      if (data.role === "CREATOR") {
        if (!data.tiktokUsername) {
          throw new Error("TikTok username is required for creators")
        }

        const existingCreator = await tx.creator.findUnique({
          where: { tiktokUsername: data.tiktokUsername },
        })
        if (existingCreator) {
          throw new Error("TikTok username already registered")
        }

        await tx.creator.create({
          data: {
            userId: session.user.id,
            tiktokUsername: data.tiktokUsername,
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
            userId: session.user.id,
            companyName: data.companyName,
          },
        })
      } else if (data.role === "BRAND") {
        if (!data.companyName) {
          throw new Error("Company name is required for brands")
        }
        await tx.brand.create({
          data: {
            userId: session.user.id,
            companyName: data.companyName,
            industry: data.industry,
          },
        })
      } else if (data.role === "AGENCY") {
        if (!data.companyName) {
          throw new Error("Company name is required for agencies")
        }
        await tx.agency.create({
          data: {
            userId: session.user.id,
            companyName: data.companyName,
            website: data.agencyWebsite,
          },
        })
      }
    })

    sendWelcomeEmail(
      session.user.email,
      session.user.name,
      data.role
    )

    return NextResponse.json(
      { message: "Profile completed", role: data.role },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }
    const message =
      error instanceof Error ? error.message : "Onboarding failed"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
