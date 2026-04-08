# Active Backlog

Source of truth: `PROGRESS.md`. This file tracks only the *actionable* pending items for the current session window.

## Open

### Infrastructure (env-var gated, no code work required)
- [ ] **Stripe**: Configure `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` in Vercel env and smoke-test the brand checkout → webhook → order OPEN flow. Code path is shipped (`src/app/api/payments/checkout/route.ts` + `src/app/api/payments/webhook/route.ts`); dev-mode fallback short-circuits when env is unset.
- [ ] **TikTok Research API**: Configure `TIKTOK_API_KEY` for bio-code verification fallback + periodic metrics refresh (requires separate TikTok Research API approval).

### Future Refactors
_All currently tracked refactors are shipped. Add new items here as they are identified._

## Recently Shipped

- **v3.15.0** (PR #90) — `CreatorCard` + `OrderCard` extraction across 5 list pages
- **v3.14.1** (PR #89) — `VerificationBanner` Alert migration + PROGRESS.md accuracy sweep
- **v3.14.0** (PR #88) — Admin audit log + bulk user ops + dispute polish
- **v3.13.0** (PR #87) — Observability (structured logger + request-ID middleware + Sentry env-gated)
