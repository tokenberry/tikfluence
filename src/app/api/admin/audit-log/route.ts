/**
 * GET /api/admin/audit-log — admin-only paginated view of the audit log.
 *
 * Query params:
 *   page        — default 1
 *   limit       — default 25, max 100
 *   action      — filter by exact action string (e.g. "user.suspend")
 *   targetType  — filter by targetType ("USER" | "ORDER" | ...)
 *   actorUserId — filter to a single admin's actions
 *
 * Returns rows ordered by `createdAt` descending with actor display info
 * joined on. Designed for the `/admin/audit-log` page but also usable
 * programmatically.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"
import type { Prisma } from "@prisma/client"

export const dynamic = "force-dynamic"

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  action: z.string().min(1).max(64).optional(),
  targetType: z.enum(["USER", "ORDER", "SETTINGS", "AGENCY_BRAND", "BULK"]).optional(),
  actorUserId: z.string().min(1).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const parsed = querySchema.safeParse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      action: searchParams.get("action") ?? undefined,
      targetType: searchParams.get("targetType") ?? undefined,
      actorUserId: searchParams.get("actorUserId") ?? undefined,
    })

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { page, limit, action, targetType, actorUserId } = parsed.data
    const skip = (page - 1) * limit

    const where: Prisma.AuditLogWhereInput = {}
    if (action) where.action = action
    if (targetType) where.targetType = targetType
    if (actorUserId) where.actorUserId = actorUserId

    const [entries, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          actorUserId: true,
          actorEmail: true,
          actorRole: true,
          action: true,
          targetType: true,
          targetId: true,
          metadata: true,
          createdAt: true,
          actorUser: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ])

    return NextResponse.json({
      entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    })
  } catch (error) {
    console.error("Error listing audit log:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
