/**
 * Structured, leveled logger.
 *
 * Zero-dependency design — emits through `console.*` underneath so it
 * routes cleanly through Vercel's log ingest in production and keeps the
 * bundle small. Output format switches on `NODE_ENV`:
 *
 *   • production  → single-line JSON (machine-parseable, queryable)
 *   • development → pretty one-line summary (human-scannable in `npm run dev`)
 *
 * Usage:
 *
 *   import { logger } from "@/lib/logger"
 *
 *   logger.info({ event: "order_created", orderId }, "Order created")
 *   logger.error({ err }, "Stripe webhook signature failed")
 *
 *   // Request-scoped child logger (see middleware.ts)
 *   const log = logger.child({ requestId, userId })
 *   log.warn({ event: "rate_limited" }, "API rate limit hit")
 *
 * Levels: debug < info < warn < error. Set `LOG_LEVEL` to raise the floor
 * (default "info" — `debug` is suppressed unless explicitly enabled).
 *
 * This logger is the single place structured observability flows through.
 * #7b migrates high-signal `console.error` call sites to use it; the rest
 * of the codebase can adopt it gradually without a big-bang refactor.
 */

type LogLevel = "debug" | "info" | "warn" | "error"

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

const ENV_LEVEL = (process.env.LOG_LEVEL ?? "info").toLowerCase() as LogLevel
const MIN_LEVEL_RANK = LEVEL_RANK[ENV_LEVEL] ?? LEVEL_RANK.info

// Log *objects* (not messages) are the primary shape — msg is optional.
// This avoids sprintf-style formatting pitfalls and keeps every field
// queryable downstream.
type LogFields = Record<string, unknown>

interface Logger {
  debug(fields: LogFields, msg?: string): void
  info(fields: LogFields, msg?: string): void
  warn(fields: LogFields, msg?: string): void
  error(fields: LogFields, msg?: string): void
  /**
   * Returns a new logger with `bindings` merged into every log record.
   * Typically used to attach a per-request `requestId`, `userId`, etc.
   */
  child(bindings: LogFields): Logger
}

/**
 * Normalise an `Error` (or anything) into a plain object with stack
 * stringified. JSON.stringify would otherwise drop Error properties
 * because they're non-enumerable.
 */
function serializeError(err: unknown): LogFields {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
      ...(err.cause ? { cause: serializeError(err.cause) } : {}),
    }
  }
  if (typeof err === "object" && err !== null) {
    return err as LogFields
  }
  return { value: String(err) }
}

/**
 * Scan the fields for a conventional `err` property and replace it with
 * its serialized form. Saves every call site from writing
 * `{ err: serializeError(err) }`.
 */
function normaliseFields(fields: LogFields): LogFields {
  if ("err" in fields && fields.err !== undefined) {
    return { ...fields, err: serializeError(fields.err) }
  }
  return fields
}

function emit(
  level: LogLevel,
  bindings: LogFields,
  fields: LogFields,
  msg: string | undefined
): void {
  if (LEVEL_RANK[level] < MIN_LEVEL_RANK) return

  const merged = {
    level,
    time: new Date().toISOString(),
    ...(msg ? { msg } : {}),
    ...bindings,
    ...normaliseFields(fields),
  }

  const sink =
    level === "error" || level === "warn"
      ? console.error
      : level === "debug"
        ? console.debug
        : console.info

  if (process.env.NODE_ENV === "production") {
    // Vercel/Datadog-friendly single-line JSON.
    sink(JSON.stringify(merged))
    return
  }

  // Dev: compact pretty print — level, time, msg, then the rest inline.
  const rest: LogFields = {}
  for (const [k, v] of Object.entries(merged)) {
    if (k !== "level" && k !== "time" && k !== "msg") rest[k] = v
  }
  const timeShort = merged.time.slice(11, 19)
  const header = `[${level}] ${timeShort}${msg ? " " + msg : ""}`
  if (Object.keys(rest).length === 0) {
    sink(header)
  } else {
    sink(header, rest)
  }
}

function createLogger(bindings: LogFields = {}): Logger {
  return {
    debug: (fields, msg) => emit("debug", bindings, fields, msg),
    info: (fields, msg) => emit("info", bindings, fields, msg),
    warn: (fields, msg) => emit("warn", bindings, fields, msg),
    error: (fields, msg) => emit("error", bindings, fields, msg),
    child: (extra) => createLogger({ ...bindings, ...extra }),
  }
}

/**
 * Default singleton logger. Import this directly in most call sites.
 * Use `logger.child({ requestId })` to attach request-scoped context.
 */
export const logger: Logger = createLogger()
