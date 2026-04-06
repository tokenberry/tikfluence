/**
 * Simple sliding-window rate limiter.
 * Uses in-memory Map — works per serverless instance.
 * For production at scale, swap to @upstash/ratelimit with Redis.
 */

interface RateLimitEntry {
  tokens: number
  lastRefill: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up old entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now

  const cutoff = now - 60 * 1000 // Remove entries older than 60s
  for (const [key, entry] of store) {
    if (entry.lastRefill < cutoff) {
      store.delete(key)
    }
  }
}

interface RateLimitConfig {
  /** Max requests per window */
  limit: number
  /** Window duration in milliseconds */
  window: number
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  retryAfter: number | null
}

export function rateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanup()

  const now = Date.now()
  const entry = store.get(key)

  if (!entry) {
    store.set(key, { tokens: config.limit - 1, lastRefill: now })
    return { success: true, limit: config.limit, remaining: config.limit - 1, retryAfter: null }
  }

  // Calculate token refill based on elapsed time
  const elapsed = now - entry.lastRefill
  const refill = Math.floor((elapsed / config.window) * config.limit)

  if (refill > 0) {
    entry.tokens = Math.min(config.limit, entry.tokens + refill)
    entry.lastRefill = now
  }

  if (entry.tokens > 0) {
    entry.tokens--
    return { success: true, limit: config.limit, remaining: entry.tokens, retryAfter: null }
  }

  // Rate limited
  const retryAfter = Math.ceil((config.window - elapsed) / 1000)
  return {
    success: false,
    limit: config.limit,
    remaining: 0,
    retryAfter: Math.max(1, retryAfter),
  }
}

// Preset configurations
export const RATE_LIMITS = {
  auth: { limit: 5, window: 60 * 1000 },       // 5 req/min for auth routes
  api: { limit: 60, window: 60 * 1000 },        // 60 req/min for general API
  upload: { limit: 10, window: 60 * 1000 },      // 10 uploads/min
} as const
