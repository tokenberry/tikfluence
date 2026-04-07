# End-to-end tests

This directory holds the Playwright tests for Foxolog. There are two
projects, configured in `playwright.config.ts`:

## 1. `smoke` — unauthenticated (runs against production by default)

Covers the landing page, legal pages, and auth pages. These are safe to
run against any deployment — they never touch authenticated data.

```bash
# production (default)
npm run test:e2e

# a preview deployment
BASE_URL=https://foxolog-git-feature-xyz.vercel.app npm run test:e2e

# local dev server
BASE_URL=http://localhost:3000 npm run test:e2e
```

First-time setup:

```bash
npm run test:e2e:install    # downloads chromium (~150 MB)
```

## 2. `authed` — authenticated role flows (local only)

Covers role-based dashboards: creator, brand, admin, network, agency,
account manager. Logs in using the demo users created by
`prisma/seed.ts` and asserts on the seeded data.

**This project only runs when `E2E_AUTHED=1` is set.** The config also
refuses to run it against any `BASE_URL` that isn't `localhost` /
`127.0.0.1`, so there's no risk of the authed tests ever executing
against production.

To run locally:

```bash
# terminal 1 — seed the DB and start the dev server
npm run db:seed
npm run dev

# terminal 2 — run the authed suite against localhost
E2E_AUTHED=1 BASE_URL=http://localhost:3000 npm run test:e2e
```

The authed tests are currently **read-only** — they assert on seeded
orders / tickets / users without mutating state, so they are idempotent
and safe to re-run without re-seeding. Full mutation flows (creator
accepts order → delivers → brand approves) are deferred until:

1. a DB reset fixture can reseed between runs, and
2. Stripe + Payoneer can be mocked so order creation / payout release
   don't hit live external services.

## Fixtures

- `e2e/fixtures/auth.ts` — `loginAs(page, user)` helper and the
  `DEMO_USERS` map keyed to the seed script's demo credentials. Logs in
  through the credentials form and waits for the middleware redirect to
  the role-specific landing page.
