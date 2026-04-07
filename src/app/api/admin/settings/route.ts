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

    let settings = await prisma.platformSettings.findUnique({
      where: { id: "default" },
    })

    if (!settings) {
      settings = await prisma.platformSettings.create({
        data: { id: "default" },
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

const updateSettingsSchema = z.object({
  platformFeeRate: z.number().min(0).max(1).optional(),
  minOrderBudget: z.number().min(0).optional(),
  maxOrderBudget: z.number().min(0).optional(),
})

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = updateSettingsSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const before = await prisma.platformSettings.findUnique({
      where: { id: "default" },
    })

    const settings = await prisma.platformSettings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        ...parsed.data,
      },
      update: parsed.data,
    })

    const actor = actorFromSession(session.user)
    if (actor) {
      await recordAudit({
        actor,
        action: "settings.update",
        targetType: "SETTINGS",
        targetId: null,
        metadata: {
          before: before
            ? {
                platformFeeRate: before.platformFeeRate,
                minOrderBudget: before.minOrderBudget,
                maxOrderBudget: before.maxOrderBudget,
              }
            : null,
          after: {
            platformFeeRate: settings.platformFeeRate,
            minOrderBudget: settings.minOrderBudget,
            maxOrderBudget: settings.maxOrderBudget,
          },
          changed: parsed.data,
        },
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
