# Active Backlog

Source of truth: `PROGRESS.md`. This file tracks only the *actionable* pending items for the current session window.

## Open

### Infrastructure (env-var gated, no code work required)
- [ ] **Stripe**: Configure `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` in Vercel env and smoke-test the brand checkout → webhook → order OPEN flow. Code path is shipped; dev-mode fallback short-circuits when env is unset. *(Waiting on Stripe account setup)*
- [ ] **TikTok Login Kit**: Set `AUTH_TIKTOK_ID` + `AUTH_TIKTOK_SECRET` in Vercel + add redirect URI in TikTok Developer Portal. *(App under TikTok review)*

### Configured (done)
- [x] **Vercel Blob** — `BLOB_READ_WRITE_TOKEN` configured
- [x] **Cron Secret** — `CRON_SECRET` configured
- [x] **OpenAI** — `OPENAI_API_KEY` configured

### Not Pursuing
- ~~**TikTok Research API**~~ — Too complex to get approved. Bio-code verification fallback + periodic metrics refresh will not be pursued.

### Future Refactors
_All currently tracked refactors are shipped. Add new items here as they are identified._

## Recently Shipped

- **v3.15.0** (PR #90) — `CreatorCard` + `OrderCard` extraction across 5 list pages
- **v3.14.1** (PR #89) — `VerificationBanner` Alert migration + PROGRESS.md accuracy sweep
- **v3.14.0** (PR #88) — Admin audit log + bulk user ops + dispute polish
- **v3.13.0** (PR #87) — Observability (structured logger + request-ID middleware + Sentry env-gated)
