import { describe, it, expect, vi, beforeEach } from "vitest"
import { actorFromSession, recordAudit } from "@/lib/audit"

// Mock the Prisma client so we don't need a real DB connection to unit
// test the recordAudit helper. We care about:
//   - the mapping from RecordAuditInput → prisma.auditLog.create args
//   - the best-effort swallowing of errors (recordAudit never throws)
vi.mock("@/lib/prisma", () => ({
  prisma: {
    auditLog: {
      create: vi.fn(),
    },
  },
}))

// Also silence the logger so test output stays clean.
vi.mock("@/lib/logger", () => ({
  logger: {
    child: () => ({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      child: vi.fn(),
    }),
  },
}))

import { prisma } from "@/lib/prisma"

describe("actorFromSession", () => {
  it("maps a populated session user to an actor", () => {
    const actor = actorFromSession({
      id: "u1",
      email: "admin@foxolog.com",
      role: "ADMIN",
    })
    expect(actor).toEqual({
      userId: "u1",
      email: "admin@foxolog.com",
      role: "ADMIN",
    })
  })

  it("returns null when session user is null or undefined", () => {
    expect(actorFromSession(null)).toBeNull()
    expect(actorFromSession(undefined)).toBeNull()
  })

  it("returns null when email is missing", () => {
    expect(
      actorFromSession({ id: "u1", email: null, role: "ADMIN" })
    ).toBeNull()
  })

  it("returns null when role is missing", () => {
    expect(
      actorFromSession({ id: "u1", email: "x@y.z", role: null })
    ).toBeNull()
  })

  it("allows userId to be missing (becomes null, not rejected)", () => {
    const actor = actorFromSession({
      id: null,
      email: "x@y.z",
      role: "ADMIN",
    })
    expect(actor).toEqual({
      userId: null,
      email: "x@y.z",
      role: "ADMIN",
    })
  })
})

describe("recordAudit", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("writes an audit row with the provided fields", async () => {
    ;(prisma.auditLog.create as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      { id: "audit_1" }
    )

    const result = await recordAudit({
      actor: { userId: "u1", email: "admin@foxolog.com", role: "ADMIN" },
      action: "user.suspend",
      targetType: "USER",
      targetId: "user_42",
      metadata: { targetEmail: "victim@example.com", reason: "spam" },
    })

    expect(result).toEqual({ id: "audit_1" })
    expect(prisma.auditLog.create).toHaveBeenCalledTimes(1)
    const args = (prisma.auditLog.create as ReturnType<typeof vi.fn>).mock
      .calls[0][0]
    expect(args.data).toMatchObject({
      actorUserId: "u1",
      actorEmail: "admin@foxolog.com",
      actorRole: "ADMIN",
      action: "user.suspend",
      targetType: "USER",
      targetId: "user_42",
    })
    // metadata is stringly cast to Json — verify it round-trips
    expect(args.data.metadata).toEqual({
      targetEmail: "victim@example.com",
      reason: "spam",
    })
  })

  it("defaults targetId to null when omitted", async () => {
    ;(prisma.auditLog.create as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      { id: "audit_2" }
    )

    await recordAudit({
      actor: { userId: "u1", email: "admin@foxolog.com", role: "ADMIN" },
      action: "settings.update",
      targetType: "SETTINGS",
    })

    const args = (prisma.auditLog.create as ReturnType<typeof vi.fn>).mock
      .calls[0][0]
    expect(args.data.targetId).toBeNull()
  })

  it("defaults metadata to null when omitted", async () => {
    ;(prisma.auditLog.create as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      { id: "audit_3" }
    )

    await recordAudit({
      actor: { userId: "u1", email: "admin@foxolog.com", role: "ADMIN" },
      action: "user.activate",
      targetType: "USER",
      targetId: "user_42",
    })

    const args = (prisma.auditLog.create as ReturnType<typeof vi.fn>).mock
      .calls[0][0]
    expect(args.data.metadata).toBeNull()
  })

  it("swallows DB errors and returns null (never throws)", async () => {
    ;(prisma.auditLog.create as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("connection refused")
    )

    const result = await recordAudit({
      actor: { userId: "u1", email: "admin@foxolog.com", role: "ADMIN" },
      action: "user.suspend",
      targetType: "USER",
      targetId: "user_42",
    })

    expect(result).toBeNull()
  })

  it("allows actorUserId to be null (pre-auth / system actor)", async () => {
    ;(prisma.auditLog.create as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      { id: "audit_4" }
    )

    await recordAudit({
      actor: { userId: null, email: "system@foxolog.com", role: "SYSTEM" },
      action: "settings.update",
      targetType: "SETTINGS",
    })

    const args = (prisma.auditLog.create as ReturnType<typeof vi.fn>).mock
      .calls[0][0]
    expect(args.data.actorUserId).toBeNull()
    expect(args.data.actorEmail).toBe("system@foxolog.com")
  })
})
