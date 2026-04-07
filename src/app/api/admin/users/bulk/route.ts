/**
 * POST /api/admin/users/bulk
 *
 * Bulk suspend / activate for the admin users page. Payload:
 *
 *   { action: "suspend" | "activate", userIds: string[] }
 *
 * Uses `updateMany` (single SQL statement) so the operation is atomic at
 * the DB level. Guards:
 *
 *   - admin role enforced
 *   - max 200 userIds per request (sanity cap to keep a single request
 *     bounded — matches the admin users page pagination ceiling of 100
 *     users/page with a small margin for multi-page selection)
 *   - never suspends the acting admin (defensive — a self-suspend would
 *     instantly lock the acting admin out of the panel)
 *
 * Writes one audit row with the full `userIds[]` array in metadata.
 * Individual per-user audit rows are deliberately not written — the
 * bulk row with the full userIds array gives the same forensic value
 * without flooding the audit table when an admin suspends 50 users at
 * once.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { actorFromSession, recordAudit } from "@/lib/audit"
import { logger } from "@/lib/logger"
import { z } from "zod"

export const dynamic = "force-dynamic"

const bulkSchema = z.object({
  action: z.enum(["suspend", "activate"]),
  userIds: z.array(z.string().min(1)).min(1).max(200),
})

export async function POST(request: NextRequest) {
  const log = logger.child({ route: "api/admin/users/bulk" })
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = bulkSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { action, userIds } = parsed.data

    // Never allow self-suspend — a bulk suspend that happens to include
    // the acting admin would immediately log them out.
    const filteredIds =
      action === "suspend"
        ? userIds.filter((id) => id !== session.user.id)
        : userIds

    if (filteredIds.length === 0) {
      return NextResponse.json(
        { error: "No valid user IDs after filtering", updated: 0 },
        { status: 400 }
      )
    }

    const result = await prisma.user.updateMany({
      where: { id: { in: filteredIds } },
      data: { isActive: action === "activate" },
    })

    const actor = actorFromSession(session.user)
    if (actor) {
      await recordAudit({
        actor,
        action: action === "suspend" ? "users.bulk_suspend" : "users.bulk_activate",
        targetType: "BULK",
        targetId: null,
        metadata: {
          userIds: filteredIds,
          count: result.count,
          skippedSelf: userIds.length !== filteredIds.length,
        },
      })
    }

    log.info(
      {
        event: "admin_users_bulk",
        action,
        requested: userIds.length,
        updated: result.count,
      },
      "bulk user status change"
    )

    return NextResponse.json({
      updated: result.count,
      action,
    })
  } catch (err) {
    log.error({ err, event: "admin_users_bulk_error" }, "bulk update failed")
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
