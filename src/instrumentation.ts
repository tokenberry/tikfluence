/**
 * Next.js instrumentation hook — runs once per Node.js / Edge worker
 * boot. This is the canonical place to wire observability SDKs into the
 * server runtime; Next.js calls `register()` exactly once per process.
 *
 * Sentry is initialised here behind a `SENTRY_DSN` env-var gate. When
 * the DSN is unset (development, CI, sandbox) every branch is a no-op
 * and the SDK is never contacted — this is how we keep the dev
 * experience zero-config while still shipping production-grade error
 * tracking when the key is present.
 *
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN
  if (!dsn) return

  // Dynamic import so the SDK isn't eagerly pulled into the worker
  // boot path in dev/CI where no DSN is configured.
  const Sentry = await import("@sentry/nextjs")

  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
      environment: process.env.NODE_ENV,
      release: process.env.NEXT_PUBLIC_APP_VERSION,
    })
  } else if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
      environment: process.env.NODE_ENV,
      release: process.env.NEXT_PUBLIC_APP_VERSION,
    })
  }
}

/**
 * Hook exported for Next.js 15+ — every server-side error reported
 * through the App Router flows through here. We forward it to Sentry
 * when the DSN is configured; in dev it's a silent no-op (the error
 * still reaches `app/error.tsx` / `app/global-error.tsx` independently
 * so the user sees something).
 */
export async function onRequestError(
  err: unknown,
  request: {
    path: string
    method: string
    headers: Record<string, string | string[] | undefined>
  },
  context: {
    routerKind: "Pages Router" | "App Router"
    routePath: string
    routeType: "render" | "route" | "action" | "middleware"
    renderSource?: string
    revalidateReason?: string
    renderType?: string
  }
) {
  const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN
  if (!dsn) return

  const Sentry = await import("@sentry/nextjs")
  Sentry.captureRequestError(err, request, context)
}
