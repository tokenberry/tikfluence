/**
 * Client-side Sentry bootstrap.
 *
 * Next.js 15+ reads `src/instrumentation-client.ts` automatically on
 * the browser side — it's the client-runtime analogue of
 * `src/instrumentation.ts`. Same env-var gate: when `SENTRY_DSN`
 * (exposed as `NEXT_PUBLIC_SENTRY_DSN` so it reaches the browser) is
 * unset, this file is a no-op and the Sentry SDK is never called, so
 * dev/CI bundles stay free of outbound telemetry.
 */

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  // Dynamic import so the Sentry browser SDK only lands in the bundle
  // graph when a DSN is actually configured. This keeps the default
  // client chunk ~300KB smaller for deployments that don't use Sentry.
  import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn,
      tracesSampleRate: Number(
        process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? "0.1"
      ),
      environment: process.env.NODE_ENV,
      release: process.env.NEXT_PUBLIC_APP_VERSION,
      // Capture unhandled promise rejections + console errors by
      // default (Sentry's own defaults are fine for now).
    })
  })
}
