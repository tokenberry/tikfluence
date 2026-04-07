import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { createVerifyState, verifyState } from "@/lib/verify-state"

describe("verify-state", () => {
  const ORIGINAL_SECRET = process.env.NEXTAUTH_SECRET

  beforeEach(() => {
    process.env.NEXTAUTH_SECRET = "test-secret-for-hmac-only"
  })

  afterEach(() => {
    process.env.NEXTAUTH_SECRET = ORIGINAL_SECRET
    vi.useRealTimers()
  })

  it("round-trips a valid payload", () => {
    const token = createVerifyState("creator-1", "user-1", "tiktok_user")
    const payload = verifyState(token)
    expect(payload).not.toBeNull()
    expect(payload?.creatorId).toBe("creator-1")
    expect(payload?.userId).toBe("user-1")
    expect(payload?.tiktokUsername).toBe("tiktok_user")
    expect(typeof payload?.exp).toBe("number")
  })

  it("rejects tokens with a tampered payload", () => {
    const token = createVerifyState("creator-1", "user-1", "tiktok_user")
    const [data, sig] = token.split(".")
    const tampered = Buffer.from(
      JSON.stringify({
        creatorId: "creator-2",
        userId: "user-1",
        tiktokUsername: "tiktok_user",
        exp: Date.now() + 60_000,
      })
    ).toString("base64url")
    expect(verifyState(`${tampered}.${sig}`)).toBeNull()
    // sanity — original still verifies
    expect(verifyState(`${data}.${sig}`)).not.toBeNull()
  })

  it("rejects tokens with a tampered signature", () => {
    const token = createVerifyState("creator-1", "user-1", "tiktok_user")
    const [data] = token.split(".")
    expect(verifyState(`${data}.deadbeef`)).toBeNull()
  })

  it("rejects malformed tokens", () => {
    expect(verifyState("")).toBeNull()
    expect(verifyState("no-dot")).toBeNull()
    expect(verifyState(".only-sig")).toBeNull()
    expect(verifyState("only-data.")).toBeNull()
  })

  it("rejects tokens signed with a different secret", () => {
    const token = createVerifyState("creator-1", "user-1", "tiktok_user")
    process.env.NEXTAUTH_SECRET = "completely-different-secret"
    expect(verifyState(token)).toBeNull()
  })

  it("rejects expired tokens", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2025-01-01T00:00:00Z"))
    const token = createVerifyState("creator-1", "user-1", "tiktok_user")
    // Advance past the 15-minute expiry
    vi.setSystemTime(new Date("2025-01-01T00:16:00Z"))
    expect(verifyState(token)).toBeNull()
  })

  it("accepts tokens within the expiry window", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2025-01-01T00:00:00Z"))
    const token = createVerifyState("creator-1", "user-1", "tiktok_user")
    vi.setSystemTime(new Date("2025-01-01T00:14:00Z"))
    expect(verifyState(token)).not.toBeNull()
  })
})
