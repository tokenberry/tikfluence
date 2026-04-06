import { describe, it, expect } from "vitest"
import { rateLimit } from "@/lib/rate-limit"

describe("rateLimit", () => {
  it("allows requests within limit", () => {
    const config = { limit: 5, window: 60_000 }
    const key = `test-allow-${Date.now()}`

    for (let i = 0; i < 5; i++) {
      const result = rateLimit(key, config)
      expect(result.success).toBe(true)
    }
  })

  it("blocks requests over limit", () => {
    const config = { limit: 3, window: 60_000 }
    const key = `test-block-${Date.now()}`

    // Use up all tokens
    for (let i = 0; i < 3; i++) {
      rateLimit(key, config)
    }

    // This should be blocked
    const result = rateLimit(key, config)
    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.retryAfter).toBeGreaterThan(0)
  })

  it("returns remaining count", () => {
    const config = { limit: 5, window: 60_000 }
    const key = `test-remaining-${Date.now()}`

    const first = rateLimit(key, config)
    expect(first.remaining).toBe(4)

    const second = rateLimit(key, config)
    expect(second.remaining).toBe(3)
  })

  it("different keys have independent limits", () => {
    const config = { limit: 2, window: 60_000 }
    const key1 = `test-key1-${Date.now()}`
    const key2 = `test-key2-${Date.now()}`

    rateLimit(key1, config)
    rateLimit(key1, config)

    // key1 should be exhausted
    expect(rateLimit(key1, config).success).toBe(false)

    // key2 should still work
    expect(rateLimit(key2, config).success).toBe(true)
  })
})
