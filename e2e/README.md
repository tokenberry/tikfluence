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
account manager (`e2e/authed.spec.ts`), plus the full order mutation
state machine — brand creates → creator accepts → delivers → brand
approves → COMPLETED (`e2e/mutation.spec.ts`). Logs in using the demo
users created by `prisma/seed.ts`.

**This project only runs when `E2E_AUTHED=1` is set.** The config also
refuses to run it against any `BASE_URL` that isn't `localhost` /
`127.0.0.1`, so there's no risk of the authed tests ever executing
against production.

### Required environment

`mutation.spec.ts` drives the full payment-gated order lifecycle, and
relies on the **dev-mode fallbacks** built into
`src/app/api/orders/[id]/checkout/route.ts`,
`src/lib/payoneer.ts`, and `src/lib/email.ts`. Those fallbacks
short-circuit external calls when the relevant env vars are **unset**.
Before running the authed suite, make sure none of these are exported
in the dev server's environment:

- `STRIPE_SECRET_KEY` (checkout will otherwise create a real Stripe
  checkout session)
- `PAYONEER_PARTNER_ID`, `PAYONEER_API_KEY` (approve will otherwise
  call Payoneer)
- `RESEND_API_KEY` (order-approved/rejected emails will otherwise
  attempt to send)

The `DATABASE_URL` must point at a local postgres (`localhost`,
`127.0.0.1`, or a docker-compose service like `@db:` / `@postgres:`).
`e2e/fixtures/reset.ts` **refuses to truncate against any non-local
DATABASE_URL** so there is no risk of wiping a staging/prod DB by
accident.

### Running locally

```bash
# terminal 1 — seed the DB and start the dev server
npm run db:seed
unset STRIPE_SECRET_KEY PAYONEER_PARTNER_ID PAYONEER_API_KEY RESEND_API_KEY
npm run dev

# terminal 2 — run the full authed suite against localhost
E2E_AUTHED=1 BASE_URL=http://localhost:3000 npm run test:e2e
```

### What each authed spec covers

- `authed.spec.ts` — read-only: every role logs in, lands on the right
  dashboard, and sees the seeded data. Does not mutate state.
- `mutation.spec.ts` — full order state machine via the HTTP API:
  - **order mutation flow**: brand creates DRAFT → publishes (checkout
    dev-mode → OPEN) → creator accepts (ASSIGNED) → creator delivers
    (DELIVERED) → wrong brand gets 403 on approve → owning brand
    approves (COMPLETED + transaction with correct payout math) →
    double-approve returns 400.
  - **order rejection flow**: same setup, brand rejects the delivery
    with a reason (DELIVERED → REVISION), creator re-delivers, order
    goes back to DELIVERED.

`mutation.spec.ts` calls `resetMutableOrderState()` in `beforeAll` so
it can re-run indefinitely without needing `npm run db:seed` again —
the seed's identity rows (users, brands, creators, categories) stay
intact and only the mutable order state (orders, assignments,
deliveries, transactions, notifications, tickets) is wiped.

## Fixtures

- `e2e/fixtures/auth.ts` — `loginAs(page, user)` helper and the
  `DEMO_USERS` map keyed to the seed script's demo credentials. Logs in
  through the credentials form and waits for the middleware redirect to
  the role-specific landing page.
- `e2e/fixtures/reset.ts` — `resetMutableOrderState()` + `disconnectPrisma()`.
  Opens a fresh `PrismaClient` against `DATABASE_URL` (rejecting any
  non-local URL) and deletes every row the mutation spec creates or
  touches, leaving the stable identity rows alone.
