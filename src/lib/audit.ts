/**
 * Admin audit log — append-only record of admin-initiated mutations.
 *
 * Every `/api/admin/*` mutation should call `recordAudit(...)` immediately
 * after the primary DB write succeeds. The helper is **best-effort**: a
 * failure writing the audit row is logged via the structured logger but
 * never thrown, so audit bookkeeping can never cause a primary action to
 * fail in production.
 *
 * Read the log from `/admin/audit-log` (admin-only page) or query it
 * programmatically via `/api/admin/audit-log`.
 *
 * Event naming convention: `domain.verb` (lowercase, dot-separated).
 *   user.suspend          — admin suspended a user
 *   user.activate         — admin re-enabled a suspended user
 *   user.role_change      — admin changed a user's role
 *   users.bulk_suspend    — bulk suspend across many userIds
 *   users.bulk_activate   — bulk activate across many userIds
 *   settings.update       — platform settings (fee rate, budget caps) changed
 *   dispute.resolve       — admin resolved a disputed order
 *   agency_brand.approve  — admin approved an agency→brand claim
 *   agency_brand.reject   — admin rejected an agency→brand claim
 */

import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

const log = logger.child({ module: "audit" })

export type AuditTargetType =
  | "USER"
  | "ORDER"
  | "SETTINGS"
  | "AGENCY_BRAND"
  | "BULK"

export interface AuditActor {
  userId: string | null // null only if the mutation pre-dates an auth boundary; normally required
  email: string
  role: string
}

export interface RecordAuditInput {
  actor: AuditActor
  action: string
  targetType: AuditTargetType
  targetId?: string | null
  metadata?: Record<string, unknown>
}

/**
 * Write an audit row. Never throws — failures are logged and swallowed.
 * Returns the created row on success, `null` on failure.
 */
export async function recordAudit(
  input: RecordAuditInput
): Promise<{ id: string } | null> {
  try {
    const row = await prisma.auditLog.create({
      data: {
        actorUserId: input.actor.userId,
        actorEmail: input.actor.email,
        actorRole: input.actor.role,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId ?? null,
        metadata: (input.metadata ?? null) as never,
      },
      select: { id: true },
    })
    log.info(
      {
        event: "audit_recorded",
        auditId: row.id,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId ?? null,
        actorUserId: input.actor.userId,
      },
      "audit row written"
    )
    return row
  } catch (err) {
    log.error(
      {
        event: "audit_write_failed",
        err,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId ?? null,
      },
      "failed to write audit row"
    )
    return null
  }
}

/**
 * Narrow the session.user shape that `next-auth` hands back into the
 * `AuditActor` shape `recordAudit` expects. Route handlers typically have
 * a session object in scope already; this just consolidates the mapping
 * so every call site doesn't duplicate the null-guarding.
 *
 * Returns `null` if the session is missing the minimum fields needed to
 * write a meaningful actor. Callers should skip `recordAudit` in that
 * case (which shouldn't happen on admin routes since the auth guard
 * already rejects unauthenticated requests).
 */
export function actorFromSession(
  user: { id?: string | null; email?: string | null; role?: string | null } | null | undefined
): AuditActor | null {
  if (!user?.email || !user.role) return null
  return {
    userId: user.id ?? null,
    email: user.email,
    role: user.role,
  }
}
