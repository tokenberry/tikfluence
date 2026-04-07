# Foxolog - Development Progress

## Project Overview
TikTok Influencer Marketplace (rebranded from Tikfluence to Foxolog)
- **Live URL**: www.foxolog.com
- **Repo**: github.com/tokenberry/tikfluence
- **Hosting**: Vercel
- **Database**: Neon (PostgreSQL)

---

## Completed

### Infrastructure
- [x] Next.js 15 project setup with TypeScript, Tailwind CSS
- [x] Prisma ORM with PostgreSQL schema (13 models)
- [x] Database deployed on Neon, schema pushed
- [x] Deployed to Vercel (Production on `main` branch)
- [x] Custom domain connected (www.foxolog.com)
- [x] NextAuth.js authentication (credentials provider)
- [x] Middleware for role-based route protection
- [x] Environment variables configured (DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL)

### Auth & Layout
- [x] Root layout with Navbar and Providers (SessionProvider)
- [x] Auth layout (centered card on cream background)
- [x] Login page (email/password, error handling)
- [x] Register page (role selector: Creator/Network/Brand, role-specific fields)
- [x] Registration API route (`/api/register`)
- [x] Navbar (dark #0a0a0a theme, role-based nav links, mobile menu, user dropdown)
- [x] Sidebar (dark #0a0a0a theme, role-based links, orange glow active states)
- [x] Dashboard layout (sidebar + main content)

### API Routes (48+ routes)
- [x] `POST /api/register` - User registration with role-specific profile creation
- [x] `GET /api/creators` - List creators with filters (category, tier, search, pagination)
- [x] `GET/PUT /api/creators/[id]` - Get/update creator profile
- [x] `GET /api/creators/me` - Current user's creator profile
- [x] `POST /api/creators/[id]/score` - Recalculate creator score via TikTok API
- [x] `GET /api/categories` - List all categories (for dropdowns)
- [x] `GET /api/brands` - Search brands by company name
- [x] `GET /api/networks` - List networks (admin only)
- [x] `GET/POST /api/networks/[id]/creators` - List/add creators in network
- [x] `GET/POST /api/orders` - List orders (role-filtered), create order (brand/agency)
- [x] `GET/PUT/DELETE /api/orders/[id]` - Order CRUD (with agency authorization)
- [x] `POST /api/orders/[id]/accept` - Creator/network accepts order
- [x] `POST /api/orders/[id]/deliver` - Submit delivery with TikTok metrics, multiple links & screenshots
- [x] `POST /api/orders/[id]/approve` - Brand approves/rejects delivery
- [x] `POST /api/orders/[id]/deliveries/[deliveryId]/review` - Brand/agency approve/reject individual delivery
- [x] `POST /api/orders/[id]/dispute` - Open dispute, creates support ticket
- [x] `POST /api/payments/connect` - Create Stripe Connect account + onboarding
- [x] `POST /api/payments/webhook` - Stripe webhook handler
- [x] `GET/POST /api/tickets` - List/create support tickets
- [x] `GET/PUT/POST /api/tickets/[id]` - Ticket detail, update, add message
- [x] `GET/PUT /api/admin/users` - User management (pagination, search, suspend)
- [x] `GET /api/admin/orders` - Admin order listing with filters
- [x] `GET /api/admin/analytics` - Platform analytics
- [x] `GET/PUT /api/admin/settings` - Platform settings (fee rate, budget limits)
- [x] `GET/PUT /api/admin/agency-brands` - Admin agency-brand approval (list + approve/reject)
- [x] `GET/PUT /api/brand/profile` - Brand settings profile management
- [x] `GET/PUT /api/network/profile` - Network profile management
- [x] `GET /api/network/creators/search` - Search unaffiliated creators by email/tiktok
- [x] `POST /api/network/creators` - Add creator to network
- [x] `GET/POST /api/agency/brands` - List agency brands + request existing / create new brand
- [x] `POST /api/upload` - File upload (images, 10MB max)
- [x] `GET/PUT /api/notifications` - List user notifications, mark all read
- [x] `PUT /api/notifications/[id]` - Mark single notification read

### Dashboard Pages (40+ pages)
- [x] **Creator**: Profile, Orders, Order Detail (with delivery form + "Report Issue" on rejected), Earnings, Tickets (list + new), Settings
- [x] **Network**: Creators list, Add creator, Orders, Order detail, Earnings, Settings
- [x] **Brand**: Browse creators, Creator detail, Orders list, New order form (with deadline + max creators), Order detail (with approve/reject, screenshots), Settings
- [x] **Admin**: Users management, Orders, Order detail (with admin actions), Transactions, Tickets (list + detail with reply), Settings, Analytics, Agency-Brand Claims
- [x] **Agency**: Brands (with add/create brand), Brand detail, Browse creators, Creator detail, Creators, Creator detail, Orders, Order detail (with delivery review), New order, Earnings
- [x] **Account Manager**: Clients, Client detail (with notes), Orders, Notes, Analytics
- [x] **Shared**: Custom 404 page, Custom 500 error page, Dashboard skeleton loader

### Core Libraries
- [x] `src/lib/prisma.ts` - Prisma client singleton
- [x] `src/lib/auth.ts` - NextAuth configuration
- [x] `src/lib/stripe.ts` - Stripe client + helpers
- [x] `src/lib/tiktok.ts` - TikTok API client
- [x] `src/lib/scoring.ts` - Creator scoring algorithm (engagement, followers, views, consistency)
- [x] `src/lib/utils.ts` - Shared utilities
- [x] `src/lib/notifications.ts` - In-app notification helper
- [x] `src/lib/email.ts` - Resend email notifications (6 templates)
- [x] `src/lib/ai.ts` - Anthropic SDK integration (creator analysis + delivery analysis)

### Branding & Theme
- [x] Rebranded from Tikfluence to Foxolog
- [x] Dark charcoal navbar (#2d3436)
- [x] Orange accent color (#d4772c)
- [x] Warm cream backgrounds (#fdf6e3)
- [x] Fox logo SVG (placeholder - needs real logo from user)
- [x] Landing page with hero, how it works, features, CTA, footer

---

## Not Yet Done

### High Priority
- [x] **Fox logo**: Fox logo PNG + favicon deployed (v1.0.0, v1.8.0)
- [ ] **Stripe integration**: Configure Stripe keys in Vercel env vars, test payment flow
- [x] **TikTok OAuth Verification**: OAuth-based account verification (v1.3.0) — set `AUTH_TIKTOK_ID` + `AUTH_TIKTOK_SECRET` in Vercel, add redirect URI to TikTok Developer Portal
- [ ] **TikTok Research API**: Configure `TIKTOK_API_KEY` for bio-code verification fallback + periodic metrics refresh (requires separate Research API approval)
- [x] **Google OAuth**: Google sign-in with PrismaAdapter, onboarding flow for new OAuth users (role selection + profile setup)
- [x] **Email notifications**: Resend integration with 6 email triggers (welcome, order accepted, delivery submitted, approved, rejected, dispute). From `notifications@foxolog.com`
- [x] **Database seeding**: Enhanced seed script with full demo data (3 brands, 5 creators across all tiers, 1 network, 7 orders at various statuses, deliveries, transactions, support ticket). Run with `npm run db:seed`

### Medium Priority
- [ ] **shadcn/ui components**: Architecture planned for reusable UI components (CreatorCard, OrderCard, etc.) - currently using inline Tailwind
- [x] **File storage**: Migrated from local `/uploads` to Vercel Blob (`@vercel/blob`) for production file storage (v3.0.0)
- [x] **Error pages**: Custom 404, 500 error pages
- [x] **Loading states**: Skeleton loaders for dashboard pages
- [x] **Form validation**: Zod client-side validation on register + ticket forms with per-field inline errors (v1.8.0)
- [x] **Search & filters**: Full-text search on creator browse page (already existed with name/category/tier/content type filters)
- [x] **Pagination**: Pagination component on browse pages + admin users (v1.8.0)

### Low Priority / Future
- [x] **Creator settings page**: Bio, portfolio links editor
- [x] **Network settings page**: Company profile editor
- [x] **TikTok auto-refresh**: Vercel Cron job refreshes stale creator metrics daily at 3 AM UTC (v3.0.0)
- [x] **Order expiration**: Vercel Cron job auto-cancels expired OPEN/ASSIGNED orders daily at 4 AM UTC with payment refund (v3.0.0)
- [x] **Analytics charts**: Recharts-powered admin analytics — order status pie chart, user role bar chart, order trend + revenue trend area charts (v3.0.0)
- [x] **Dark mode**: Dark landing page + dark chrome dashboard theme (sidebar, navbar, mobile header)
- [x] **Mobile optimization**: Responsive padding, headings, table scroll with min-width across all 20+ dashboard pages (v3.0.0)
- [x] **Rate limiting**: Sliding-window rate limiter — 60 req/min API, 5 req/min auth, 10 req/min uploads, 429 responses with Retry-After (v3.0.0)
- [x] **Testing**: Vitest + @testing-library/react setup, 21 unit tests for scoring, utils, rate-limit (v3.0.0)

### API Routes Planned but Not Built
- [ ] `POST /api/tiktok/verify` - TikTok profile verification endpoint
- [ ] `POST /api/tiktok/refresh` - TikTok metrics refresh endpoint

---

## Architecture Differences
Things that differ from the original `docs/ARCHITECTURE.md` plan:

1. **No shadcn/ui** - Using plain Tailwind instead of shadcn/ui component library
2. **No Footer component** - Footer is inline in the homepage
3. **No separate component files** - CreatorCard, OrderCard, etc. are inline rather than separate components
4. **Admin routes** - Split into separate route files instead of catch-all `admin/[...path]`
5. **No brands API route** - Brand profile managed through settings page
6. **Hosting** - Using Vercel instead of DigitalOcean Droplet
7. **Resend email integration** added (v0.2.0)

---

## Environment Variables Status
| Variable | Status |
|---|---|
| `DATABASE_URL` | Configured (Neon) |
| `NEXTAUTH_SECRET` | Configured |
| `NEXTAUTH_URL` | Configured (`https://www.foxolog.com`) |
| `STRIPE_SECRET_KEY` | Not set |
| `STRIPE_WEBHOOK_SECRET` | Not set |
| `GOOGLE_CLIENT_ID` | Configured (Google Cloud Console) |
| `GOOGLE_CLIENT_SECRET` | Configured (Google Cloud Console) |
| `RESEND_API_KEY` | Configured (Resend — domain verified) |
| `AUTH_TIKTOK_ID` | Needs configuration (TikTok Login Kit — Client Key) |
| `AUTH_TIKTOK_SECRET` | Needs configuration (TikTok Login Kit — Client Secret) |
| `TIKTOK_API_KEY` | Not set (Research API — separate approval needed) |
| `OPENAI_API_KEY` | Needs configuration (OpenAI GPT-4o-mini for creator analysis) |
| `BLOB_READ_WRITE_TOKEN` | Needs configuration (Vercel Blob — auto-set when Blob store is linked in Vercel dashboard) |
| `CRON_SECRET` | Needs configuration (random secret for Vercel Cron job authorization) |

---

## Version History
| Version | Date | Changes |
|---------|------|---------|
| 0.1.0 | 2026-03-25 | Initial full-stack app: auth, 19 API routes, 20+ dashboard pages, Prisma schema, Vercel deployment |
| 0.1.1 | 2026-03-25 | Enhanced database seed with full demo data (brands, creators, network, orders, deliveries, transactions, support ticket) |
| 0.2.0 | 2026-03-25 | Google OAuth with onboarding flow + Resend email notifications (6 triggers across order lifecycle) |
| 0.2.1 | 2026-03-26 | Fix: added `image` field to User model for Google OAuth PrismaAdapter compatibility |
| 0.2.2 | 2026-03-26 | Fix: redirect OAuth users to onboarding from public routes + TypeScript null fix |
| 0.2.3 | 2026-03-26 | Fix: allow API routes through middleware for role-less OAuth users |
| 0.2.4 | 2026-03-26 | Fix: Navbar and Sidebar links missing role prefix (404 on all dashboard pages) |
| 0.2.5 | 2026-03-27 | Fix: admin tickets server component onClick error, brand browse creator detail page, categories API, order publish/cancel actions, admin orders API |
| 0.2.6 | 2026-03-27 | Feat: 4 missing API endpoints — brand profile, network creator search/add, delivery review |
| 0.2.7 | 2026-03-27 | Feat: delivery form — drag-drop screenshot upload (max 10), multiple TikTok links, timeline grey line fix, auto prisma db push on Vercel build |
| 0.3.0 | 2026-03-28 | Feat: 6 order system fixes — screenshot display, order deadlines, REVISION timeline, in-app notifications, admin order detail page, APPROVED→COMPLETED flow |
| 0.4.0 | 2026-03-29 | Feat: 3 order types (SHORT_VIDEO/LIVE/COMBO) with type-specific pricing, delivery metrics, and content guidelines + AI-powered creator scoring via Claude API |
| 0.4.1 | 2026-03-29 | Fix: Content type selection on registration/onboarding, editable content types on creator profile, order type lock on incompatible creators |
| 0.5.0 | 2026-03-29 | Feat: Agency + Account Manager dimension — 2 new roles, 7 new models (Agency, AgencyBrand, AgencyCreator, AccountManager, AccountManagerBrand, AccountManagerAgency, InternalNote), full dashboards + API routes for both roles, admin AM management |
| 0.6.0 | 2026-03-29 | Feat: Post-delivery AI analysis — AiDeliveryAnalysis model, async AI analysis on delivery approval via Claude, DeliveryAiInsights component on brand + creator order pages, performance scoring (0-100) |
| 0.6.1 | 2026-03-29 | Fix: Security hardening — authorization on GET /orders/[id] (IDOR), Zod validation on delivery review + brand profile, auth on GET /creators/[id], duplicate AM assignment check, agency-brand PENDING approval status |
| 0.7.0 | 2026-03-29 | Feat: Admin agency approval page, creator/network settings pages, error pages, loading states, mobile-responsive timelines |
| 0.7.1 | 2026-03-29 | Fix: Admin ticket detail 404, agency brand status display, non-approved brands blocked |
| 0.7.2 | 2026-03-29 | Feat: Agency order publish/cancel, agency order detail page, clickable order titles |
| 0.7.3 | 2026-03-29 | Feat: Agency delivery review (approve/reject), clickable orders on brand detail |
| 0.7.4 | 2026-03-29 | Feat: Creator support tickets (list + create with order context), max creators field on order form, agency browse creators page |
| 0.8.0 | 2026-03-29 | Feat: Agency brand management — search existing brands (request with admin approval) or create new brands (auto-approved), approved-only brand dropdown on order creation |
| 1.0.0 | 2026-03-30 | Feat: TikTok OAuth Login Kit integration, fox logo PNG + favicon |
| 1.0.1 | 2026-03-31 | Fix: Security hardening — 10 critical/high fixes: AI JSON crash, Stripe webhook crash, middleware role redirects, race conditions in order acceptance & delivery approval, verification code entropy, email URL configurability, notification polling optimization, webhook idempotency, file upload magic byte validation |
| 1.1.0 | 2026-03-31 | Feat: Payment architecture — Stripe checkout (escrow), Payoneer creator payouts, platform credit system, admin dispute resolution |
| 1.1.1 | 2026-04-01 | Fix: Version consistency — synced package.json/package-lock.json from 0.1.0 to 1.1.0, added APP_VERSION constant + in-app version display in Sidebar and landing page footer |
| 1.2.0 | 2026-04-01 | Fix: Comprehensive audit — 15 high/medium fixes: double-payment race condition, payment math for multi-creator orders, Account Manager authorization, Navbar nav sync, ADMIN delivery review access, AI response validation + timeout, resolve-dispute multi-creator support, middleware admin API protection, register orphan user prevention, file upload extension validation, content type form validation, scoring algorithm smoothing, 5 new DB indexes |
| 1.3.0 | 2026-04-02 | Feat: TikTok OAuth verification — creators verify account ownership by logging into TikTok (username match), replacing Research API bio-code dependency. Works with just Login Kit credentials. |
| 1.4.0 | 2026-04-02 | Feat: UI component library + design consistency — 7 reusable components (Badge, Button, Toast, ConfirmDialog, EmptyState, FormField, ui-constants), replaced inline color mappings across 30+ pages, standardized focus rings to brand orange |
| 1.5.0 | 2026-04-03 | Feat: UX polish — replaced 31 alert() with Toast notifications, 3 confirm() with ConfirmDialog, LoadingSpinner component (7 pages), EmptyState component (6 pages), Sidebar icons (Lucide), eliminated all indigo colors → brand orange across 19 files |
| 1.6.0 | 2026-04-03 | Feat: Mobile sidebar drawer, dashboard home pages (Creator/Brand/Network/Agency with stats + quick actions), landing page polish (Lucide icons, hover animations, subtitles) |
| 1.7.0 | 2026-04-03 | Feat: UX navigation overhaul — post-login redirect to role dashboard, uniform sidebar nav ordering, support tickets for all roles (brand/agency/network/account-manager), simplified top navbar (single Dashboard button), Settings moved to user dropdown, agency settings page + API |
| 1.8.0 | 2026-04-03 | Feat: Fox favicon, Pagination component (browse + admin users), eliminated all remaining indigo colors (17 occurrences → brand orange), Zod client-side validation on register + ticket forms with per-field errors, admin users API now supports AGENCY/ACCOUNT_MANAGER role filter |
| 1.9.0 | 2026-04-03 | Feat: AI analysis moved from creator profile to brand/agency browse pages (helps order placers pick creators), switched from Anthropic to OpenAI GPT-4o-mini, reusable AiInsightsPanel component with run/refresh, Stripe→Payoneer on payout pages |
| 1.9.1 | 2026-04-04 | Feat: Landing page redesign — dark + glowy (#0a0a0a) theme with Framer Motion scroll animations, gradient text, animated stat counters, interactive glow cards with cursor-following radial gradient, social proof bar, brand/creator split section. Full rebrand Tikfluence → Foxolog across all pages. |
| 1.9.2 | 2026-04-04 | Feat: Dark chrome dashboard theme — sidebar, navbar, and mobile header updated to #0a0a0a with orange glow active states, matching the landing page aesthetic. Content areas remain light for readability. |
| 1.9.3 | 2026-04-05 | Feat: Password-protected presentation deck at /deck — 10-slide partner/client deck with Framer Motion transitions, keyboard navigation, progress dots, session-based password gate. Slides: Cover, Problem, Insider Insight, Solution, How It Works, Market, Why Now, Features, Global Vision, CTA. |
| 1.9.4 | 2026-04-05 | Feat: SEO & AI search optimization — comprehensive metadata (OG, Twitter Cards, 20 keywords), JSON-LD structured data (Organization + WebApplication + WebSite), dynamic OG image via ImageResponse, sitemap.ts, robots.ts, per-page metadata for login/register |
| 2.0.0 | 2026-04-05 | Feat: Full multi-language i18n with next-intl v4 — 5 languages (EN, AR, TR, FR, ES), 660 keys each, RTL support for Arabic, language switcher, 55+ pages wired |
| 3.0.0 | 2026-04-06 | Feat: Production infrastructure — Vercel Blob file storage, Vercel Cron jobs (TikTok metrics refresh + order expiration), Recharts analytics dashboard (4 charts), mobile optimization (20+ pages), API rate limiting (sliding window), Vitest test suite (21 tests) |
| 3.0.1 | 2026-04-07 | Fix: TikTok app review rejection — added Terms of Service & Privacy Policy links to landing page footer (and login + register pages) so ToS/PP are easily accessible from the homepage. Translated `footer_terms` / `footer_privacy` keys across all 5 locales (en, ar, tr, fr, es). The `/terms` and `/privacy` pages already existed but were not linked from the new landing page. |
| 3.0.2 | 2026-04-07 | Fix: Lint baseline cleanup — disabled `@next/next/no-html-link-for-pages` (Pages Router rule, misfires under App Router; was producing 228 spurious errors); fixed 4 real React 19 / React Compiler errors: NotificationBell now uses `useRouter().push()` instead of `window.location.href` and a stateful `now` (30s tick) instead of `Date.now()` in render to satisfy `react-hooks/immutability` + `react-hooks/purity`; targeted `react-hooks/set-state-in-effect` disable comments on legitimate one-shot URL-param + sessionStorage effects in `VerificationBanner` and `deck/page.tsx`. Lint now reports 0 errors (down from 232). All 21 vitest tests pass; tsc clean. |
| 3.1.0 | 2026-04-07 | Feat: Playwright E2E smoke tests + GitHub Actions CI — new `e2e/smoke.spec.ts` with 8 tests covering landing page render, **footer ToS + Privacy links (TikTok review compliance regression guard)**, footer link navigation, `/terms` + `/privacy` page render, and `/login` + `/register` legal-link visibility. Configured `playwright.config.ts` with `BASE_URL` env (defaults to `https://www.foxolog.com`). New `.github/workflows/smoke.yml` runs the suite automatically on push to main (with 90s Vercel-deploy delay), daily at 06:00 UTC, and via manual workflow_dispatch. Browser binary cached between runs. HTML report uploaded as artifact on failure. |

---

## Session Logs

### March 25, 2026

**v0.1.0 → v0.1.1 — Database Seeding Enhancement**
- Enhanced `prisma/seed.ts` from bare minimum (admin + categories) to full demo environment
- Added: 3 brands, 5 creators (all tiers), 1 network, 7 orders (all lifecycle statuses), deliveries, transactions, 1 dispute support ticket
- All operations use upsert for idempotency

**v0.1.1 → v0.2.0 — Google OAuth + Email Notifications**
- Added Google provider to NextAuth with `@auth/prisma-adapter`
- New Prisma models: `Account`, `VerificationToken`
- Made `User.password` and `User.role` optional for OAuth users
- Built `/onboarding` page + `/api/onboarding` route for first-time OAuth users to pick role
- Middleware redirects users without role to onboarding, blocks onboarded users from re-accessing it
- Google sign-in buttons on both login and register pages
- JWT callback refreshes role from DB when null (handles post-onboarding session update)
- Installed `resend` package, created `src/lib/email.ts`
- 6 email functions with Foxolog-branded HTML templates:
  - `sendWelcomeEmail` — on register + onboarding
  - `sendOrderAcceptedEmail` — brand notified when creator accepts
  - `sendDeliverySubmittedEmail` — brand notified when delivery submitted
  - `sendOrderApprovedEmail` — creator notified on approval with payout amount
  - `sendOrderRejectedEmail` — creator notified with rejection reason
  - `sendDisputeOpenedEmail` — all parties notified
- Fire-and-forget pattern (never blocks API responses)
- Graceful fallback when `RESEND_API_KEY` is not set

**Infrastructure (done manually)**
- Pushed schema to Neon database (`prisma db push`)
- Ran seed script to populate demo data
- Configured Google OAuth credentials in Vercel
- Added Resend API key in Vercel
- Verified foxolog.com domain in Resend (DNS records on Namecheap)
- Merged PR #2

**Files created:** `src/app/(auth)/onboarding/page.tsx`, `src/app/api/onboarding/route.ts`, `src/lib/email.ts`

**Files modified:** `prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/auth.ts`, `src/middleware.ts`, `src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx`, `src/app/api/register/route.ts`, `src/app/api/orders/[id]/accept/route.ts`, `src/app/api/orders/[id]/deliver/route.ts`, `src/app/api/orders/[id]/approve/route.ts`, `src/app/api/orders/[id]/dispute/route.ts`, `src/app/(dashboard)/admin/analytics/page.tsx`, `src/app/(dashboard)/admin/users/page.tsx`, `src/app/api/admin/analytics/route.ts`, `package.json`, `PROGRESS.md`

### March 26, 2026

**v0.2.0 → v0.2.4 — Google OAuth & Navigation Bug Fixes**

Session focused on fixing Google OAuth login flow end-to-end and broken dashboard navigation.

- **v0.2.1** (PR #5): Added `image String?` field to Prisma `User` model — `@auth/prisma-adapter` passes Google profile picture as `image`, but schema only had `avatar`, causing Prisma "Unknown argument" server error on OAuth callback. Ran `prisma db push` to sync Neon DB.
- **v0.2.2** (PR #6): Moved onboarding redirect check before public routes in middleware — OAuth users landing on `/` weren't being redirected to `/onboarding` because `/` was a public route that bypassed the role check. Also fixed TypeScript null type error on `user.role` (non-null assertion safe after early return).
- **v0.2.3** (PR #6): Changed middleware to allow all `/api/` routes through for role-less users — the onboarding form POST to `/api/onboarding` was being intercepted by the middleware and redirected, preventing form submission.
- **v0.2.4** (PR #7 + #8): Fixed Navbar and Sidebar `roleNavLinks` missing role prefix — links pointed to `/creators` instead of `/network/creators`, `/orders` instead of `/brand/orders`, etc., causing 404 on all dashboard pages for Creator, Network, and Brand roles.

**Infrastructure (done manually by user)**
- Updated `NEXTAUTH_URL` from `https://foxolog.com` to `https://www.foxolog.com` in Vercel env vars (fixed Google OAuth `redirect_uri_mismatch` error)
- Confirmed Google OAuth redirect URI `https://www.foxolog.com/api/auth/callback/google` in Google Cloud Console
- Created local `.env` file with Neon `DATABASE_URL` and ran `npx prisma db push` to add `image` column to production database
- Merged PRs #5, #6, #7, #8; Closed stale PR #3

**Files modified:** `prisma/schema.prisma`, `src/middleware.ts`, `src/components/layout/Navbar.tsx`, `src/components/layout/Sidebar.tsx`, `package.json`

### March 27, 2026

**v0.2.4 → v0.2.5 — Admin & Brand Bug Fixes**

Session focused on systematically testing each role and fixing server errors, missing pages, and missing API endpoints.

- **v0.2.5** (PR #11): Fixed admin tickets page server component using `onClick` (replaced with `Link`). Created brand browse creator detail page (`/brand/browse/[id]`). Created `/api/categories` endpoint for category dropdowns. Created `OrderActions` component for brand to publish/cancel orders. Created `/api/admin/orders` endpoint for admin orders page.

**v0.2.5 → v0.2.6 — Missing API Endpoints Audit**

Ran comprehensive codebase audit to find all frontend pages referencing API endpoints that were never created. Found and built 4 missing endpoints:

- **v0.2.6** (PR #15): Created `/api/brand/profile` (GET/PUT) for brand settings page. Created `/api/network/creators/search` (GET) for network creator search. Created `/api/network/creators` (POST) for adding creators to network. Created `/api/orders/[id]/deliveries/[deliveryId]/review` (POST) for brand delivery approval/rejection.

**v0.2.6 → v0.2.7 — Delivery Form Improvements**

- **v0.2.7** (PR #16 + #17): Replaced "Screenshot URL" text input with drag-drop/paste image uploader (max 10 images, JPEG/PNG/WebP/GIF). Added multiple TikTok links support per delivery. Fixed grey vertical line on creator order page (buggy absolute-positioned div in timeline). Added `tiktokLinks String[]` and `screenshots String[]` fields to Delivery model. Added `prisma db push --skip-generate` to Vercel build script so schema changes apply automatically on deploy.

**Files created:** `src/app/(dashboard)/brand/browse/[id]/page.tsx`, `src/app/(dashboard)/brand/orders/[id]/OrderActions.tsx`, `src/app/api/categories/route.ts`, `src/app/api/admin/orders/route.ts`, `src/app/api/brand/profile/route.ts`, `src/app/api/network/creators/search/route.ts`, `src/app/api/network/creators/route.ts`, `src/app/api/orders/[id]/deliveries/[deliveryId]/review/route.ts`

**Files modified:** `prisma/schema.prisma`, `package.json`, `src/app/(dashboard)/admin/tickets/page.tsx`, `src/components/layout/Navbar.tsx`, `src/components/layout/Sidebar.tsx`, `src/app/(dashboard)/creator/orders/[id]/page.tsx`, `src/app/(dashboard)/creator/orders/[id]/DeliveryForm.tsx`, `src/app/api/orders/[id]/deliver/route.ts`

**PRs merged:** #11, #14, #15, #16, #17

### March 28, 2026

**v0.2.7 → v0.3.0 — Order System Overhaul (6 Issues)**

Session focused on fixing 6 user-reported issues with the order lifecycle, delivery display, and admin functionality.

- **Issue 1 — Screenshots not visible on deliveries**: Brand and network order detail pages were not rendering `delivery.screenshots[]` or `delivery.tiktokLinks[]` (only the creator page had this from v0.2.7). Added screenshot thumbnail gallery and multiple TikTok links display to both brand and network order detail pages.

- **Issue 2 — Orders need a deadline/time limit**: The `Order.expiresAt` field existed in the schema but was never populated. Added a required "Deadline" date picker to the brand new order form (minimum: tomorrow). Updated `createOrderSchema` API to accept and store `deadline` → `expiresAt`. Added deadline display card on all 4 order detail pages (brand, creator, network, admin) with red "Overdue" indicator when past due.

- **Issue 3 — REVISION not shown on timeline**: When order status was REVISION, `statusSteps.indexOf("REVISION")` returned -1, leaving all timeline steps grey/unhighlighted. Fixed by mapping REVISION to the DELIVERED step index and showing an orange ring + "REVISION" label. Same treatment for DISPUTED status.

- **Issue 4 — In-app notifications for order updates**: Built a complete notification system:
  - New `Notification` model in Prisma (id, userId, type, title, message, link, read, createdAt)
  - `src/lib/notifications.ts` — `createNotification()` helper
  - `GET/PUT /api/notifications` — list user's notifications + mark all read
  - `PUT /api/notifications/[id]` — mark single notification read
  - `NotificationBell` component in navbar — bell icon with unread count badge, dropdown with recent notifications, 30-second polling
  - Notification triggers added to 4 API routes:
    - `POST /api/orders/[id]/accept` → notifies brand "Creator accepted your order"
    - `POST /api/orders/[id]/deliver` → notifies brand "Delivery submitted"
    - `POST /api/orders/[id]/approve` → notifies creator on approval (with payout) or revision request
    - `POST /api/orders/[id]/deliveries/[deliveryId]/review` → same approval/rejection notifications

- **Issue 5 — Admin can't open order detail page (404)**: `src/app/(dashboard)/admin/orders/[id]/page.tsx` didn't exist. Created full admin order detail page with: order stats, brand info, deadline, timeline (with REVISION fix), assigned creators, deliveries (with screenshots), transactions history, and admin action buttons (Force Complete, Cancel Order). Created `AdminOrderActions` client component.

- **Issue 6 — APPROVED → COMPLETED transition missing**: Both `/api/orders/[id]/approve` and `/api/orders/[id]/deliveries/[deliveryId]/review` were setting status to APPROVED, but nothing ever transitioned to COMPLETED. Changed both endpoints to set status directly to COMPLETED. The review endpoint was also missing transaction creation and payment logic — added full payout calculation, Stripe transfer attempt, Transaction record creation, and OrderAssignment completedAt. Removed APPROVED from timeline steps on all pages (now: DRAFT → OPEN → ASSIGNED → IN_PROGRESS → DELIVERED → COMPLETED).

**Files created:** `src/app/(dashboard)/admin/orders/[id]/page.tsx`, `src/app/(dashboard)/admin/orders/[id]/AdminOrderActions.tsx`, `src/lib/notifications.ts`, `src/app/api/notifications/route.ts`, `src/app/api/notifications/[id]/route.ts`, `src/components/layout/NotificationBell.tsx`

**Files modified:** `prisma/schema.prisma`, `package.json`, `src/app/(dashboard)/brand/orders/[id]/page.tsx`, `src/app/(dashboard)/brand/orders/new/page.tsx`, `src/app/(dashboard)/creator/orders/[id]/page.tsx`, `src/app/(dashboard)/network/orders/[id]/page.tsx`, `src/app/api/orders/route.ts`, `src/app/api/orders/[id]/accept/route.ts`, `src/app/api/orders/[id]/approve/route.ts`, `src/app/api/orders/[id]/deliver/route.ts`, `src/app/api/orders/[id]/deliveries/[deliveryId]/review/route.ts`, `src/components/layout/Navbar.tsx`

**Infrastructure needed after merge:**
- Run `prisma db push` to add `Notification` table to Neon database (auto-runs on Vercel build)

### March 29, 2026

**v0.3.0 → v0.4.0 — Order Types + AI Creator Scoring**

Major feature release adding 3 order types (SHORT_VIDEO, LIVE, COMBO) and AI-powered creator analysis via Claude API.

**Phase 1 — Order Types (LIVE / SHORT_VIDEO / COMBO):**

- **Schema**: Added `OrderType` and `DeliveryType` enums. Order model gets `type` (defaults SHORT_VIDEO for backward compat), `liveFlatFee`, `liveMinDuration`, `liveGuidelines`. Delivery model gets `deliveryType`, `streamDuration`, `peakViewers`, `avgConcurrentViewers`, `chatMessages`, `giftsValue`. Creator model gets `supportsLive`, `supportsShortVideo` flags.

- **Order Creation**: New 3-card type selector (Short Video / LIVE Stream / Combo) on brand order form. Conditional fields based on type — SHORT_VIDEO shows CPM-based pricing (existing), LIVE shows flat fee per stream + min duration + content guidelines, COMBO shows both. LIVE restriction warning banner: "Must use product placement or sponsored gameplay."

- **Delivery Flow**: DeliveryForm now type-aware — shows video metrics (impressions, views, likes, etc.) for SHORT_VIDEO or LIVE metrics (stream duration, peak viewers, concurrent viewers, chat messages, gifts value) for LIVE. COMBO orders let creators toggle between submitting a LIVE or SHORT_VIDEO delivery.

- **Pricing Model**: SHORT_VIDEO = CPM-based (existing). LIVE = flat fee per stream. COMBO = CPM budget for video portion + flat fee for LIVE portion.

- **All 4 order detail pages**: Updated (brand, creator, network, admin) with OrderTypeBadge component, conditional info cards (video vs LIVE metrics), LIVE content guidelines section, and type-specific delivery metric display.

- **Creator Browse**: Added content type filter dropdown (All / Short Video / LIVE), content type badges (Video/LIVE) on creator cards. Updated `/api/creators` to accept `contentType` filter.

**Phase 2 — AI-Powered Creator Scoring:**

- **`src/lib/ai.ts`**: Anthropic SDK integration with `analyzeCreator()` function. Sends structured prompt with creator's TikTok metrics, categories, engagement data to Claude Sonnet. Returns natural language summary, strengths, weaknesses, best content types, audience insights, content style, recommended CPM. Stores results in `AiCreatorAnalysis` table.

- **`AiCreatorAnalysis` model**: New Prisma model storing AI analysis results — summary, strengths[], weaknesses[], bestContentTypes[], audienceInsights, contentStyle, recommendedCpm. Indexed by creatorId.

- **`POST/GET /api/creators/[id]/ai-analyze`**: POST triggers AI analysis (creator or admin only). GET returns latest analysis.

- **Creator Profile**: New `AiInsights` client component — shows AI analysis with strengths/weaknesses cards, content type suitability badges, recommended CPM, and "Run/Refresh AI Analysis" button.

- **Brand Creator Detail**: Server-side AI insights display with summary, best-for badges, strengths/weaknesses, and AI recommended CPM.

**Files created:** `src/lib/ai.ts`, `src/app/api/creators/[id]/ai-analyze/route.ts`, `src/app/(dashboard)/creator/profile/AiInsights.tsx`

**Files modified:** `prisma/schema.prisma`, `package.json`, `package-lock.json`, `src/app/api/orders/route.ts`, `src/app/api/orders/[id]/deliver/route.ts`, `src/app/api/creators/route.ts`, `src/app/(dashboard)/brand/orders/new/page.tsx`, `src/app/(dashboard)/brand/orders/[id]/page.tsx`, `src/app/(dashboard)/brand/browse/page.tsx`, `src/app/(dashboard)/brand/browse/[id]/page.tsx`, `src/app/(dashboard)/creator/orders/[id]/page.tsx`, `src/app/(dashboard)/creator/orders/[id]/DeliveryForm.tsx`, `src/app/(dashboard)/creator/profile/page.tsx`, `src/app/(dashboard)/network/orders/[id]/page.tsx`, `src/app/(dashboard)/admin/orders/[id]/page.tsx`

**Dependencies added:** (none — uses OpenAI GPT-4o-mini via plain fetch)

**Environment variables needed:**
- `OPENAI_API_KEY` — Required for AI creator analysis feature (OpenAI GPT-4o-mini)

**Infrastructure needed after merge:**
- Run `prisma db push` to apply schema changes (auto-runs on Vercel build)
- Set `OPENAI_API_KEY` in Vercel environment variables

**v0.5.0 (completed):** Agency + Account Manager roles with full dashboards
**v0.6.0 (completed):** Post-delivery AI analysis + "What's Next" suggestions
**v0.6.1 (completed):** Security hardening (authorization, validation, data protection)
**v0.7.0 (completed):** Polish — admin agency approval page, settings pages, error pages, skeleton loaders, mobile responsiveness
**v0.7.1–v0.7.4 (completed):** Agency workflow fixes — ticket detail, brand status, order management, delivery review, browse creators
**v0.8.0 (current):** Agency brand management — create/request brands, approved-only order dropdown

---

### v0.4.1 — Content Type Selection & Order Type Lock (PR #TBD)

**What changed:**

1. **Creator content type selection during registration & onboarding**: Creators now choose whether they support Short Video, LIVE Stream, or both when creating their account (both credential-based registration and Google OAuth onboarding).

2. **Editable content types on creator profile**: The Content Types section on the creator profile page is now interactive — creators can toggle Short Video / LIVE Stream support and save changes.

3. **Creator profile update API**: The `PUT /api/creators/[id]` endpoint now accepts `supportsShortVideo` and `supportsLive` boolean fields.

4. **Order type lock on acceptance**: Creators who don't support a required content type cannot accept incompatible orders:
   - LIVE orders locked for creators without LIVE support
   - Short Video orders locked for creators without Video support
   - Combo orders locked for creators without both
   - Backend enforcement in `POST /api/orders/[id]/accept`
   - Frontend shows locked state with explanation text instead of Accept button

5. **Order type badges on creator order listing**: Available orders now show type badges (Video / LIVE / Combo) so creators can see what's required at a glance.

**Files created:** `src/app/(dashboard)/creator/profile/ContentTypeEditor.tsx`

**Files modified:** `src/app/api/register/route.ts`, `src/app/api/onboarding/route.ts`, `src/app/api/creators/[id]/route.ts`, `src/app/api/orders/[id]/accept/route.ts`, `src/app/(auth)/register/page.tsx`, `src/app/(auth)/onboarding/page.tsx`, `src/app/(dashboard)/creator/profile/page.tsx`, `src/app/(dashboard)/creator/orders/page.tsx`, `src/app/(dashboard)/creator/orders/AcceptOrderButton.tsx`, `package.json`

### March 29, 2026 (Session 2)

**v0.7.0 → v0.8.0 — Agency Workflow + Creator Tickets + Brand Management**

Continued from v0.7.0 session. Focused on agency workflow completeness, creator support tickets, and brand management.

**v0.7.1 (PR #29/#30):** Fixed admin ticket detail 404 (created full ticket detail page with status/priority controls, message thread, reply form). Added approval status badges (PENDING/APPROVED/REJECTED) to agency brands page. Blocked non-approved brands from being clickable.

**v0.7.2 (PR #30/#31):** Agency order publish/cancel — agencies with approved brand links can now publish (DRAFT→OPEN) and cancel orders via `AgencyOrderActions` component. Created agency order detail page (`/agency/orders/[id]`) with full order view, stats, timeline, creators, deliveries, screenshots, AI insights. Made order titles clickable on agency orders list.

**v0.7.3 (PR #32):** Agency delivery review — updated `POST /orders/[id]/deliveries/[deliveryId]/review` to allow AGENCY role with proper AgencyBrand authorization check. Added `DeliveryActions` component (approve/reject buttons) to agency order detail page for pending deliveries. Made order titles clickable on agency brand detail page.

**v0.7.4 (PR #33):** Three features:
1. **Creator support tickets** — "Report Issue" button on rejected deliveries linking to ticket creation form pre-filled with order context. Created `/creator/tickets` list page and `/creator/tickets/new` creation page. Added "Tickets" to creator sidebar.
2. **Max creators field** — Added `maxCreators` number input to order creation form (field existed in schema/API but wasn't in UI). Shows "How many creators can claim this order (budget is split between them)".
3. **Agency browse creators** — Created `/agency/browse` page (same search/filter/grid UI as brand browse) with creator detail pages at `/agency/browse/[id]`. Added "Browse" to agency sidebar.

**v0.8.0 (PR #34/#35/#36):** Agency brand management:
- Replaced static "Contact admin to link brands" with working "Add Brand" button
- Search-first flow: type brand name → if found, "Request" button (requires admin approval, PENDING status) → if not found, create form appears automatically with industry/website/description fields
- Agency-created brands are auto-approved (APPROVED status, no admin needed)
- Created `GET /api/brands` endpoint for brand search
- Updated `POST /api/agency/brands` to support `createBrand: true` mode (creates User + Brand + AgencyBrand in transaction)
- Fixed agency order creation dropdown to only show APPROVED brands

**Key patterns established:**
- Agency authorization: find agency by userId → check AgencyBrand link with `status: "APPROVED"`
- Reuse of client components across dashboards (DeliveryActions, AgencyOrderActions)
- AgencyBrand approval workflow: agency claims/creates brand → admin approves (or auto-approve for created) → only APPROVED links allow order creation, brand detail access, delivery review

**Files created:**
- `src/app/(dashboard)/admin/tickets/[id]/page.tsx` — Admin ticket detail
- `src/app/(dashboard)/admin/agency-brands/page.tsx` — Admin agency-brand approval
- `src/app/api/admin/agency-brands/route.ts` — Admin agency-brand API
- `src/app/(dashboard)/agency/orders/[id]/page.tsx` — Agency order detail
- `src/app/(dashboard)/agency/brands/[id]/AgencyOrderActions.tsx` — Agency order publish/cancel
- `src/app/(dashboard)/agency/brands/RequestBrandForm.tsx` — Add brand form (search/create)
- `src/app/(dashboard)/agency/browse/page.tsx` — Agency browse creators
- `src/app/(dashboard)/agency/browse/[id]/page.tsx` — Agency creator detail
- `src/app/(dashboard)/creator/tickets/page.tsx` — Creator tickets list
- `src/app/(dashboard)/creator/tickets/new/page.tsx` — Create ticket form
- `src/app/(dashboard)/creator/settings/page.tsx` — Creator settings
- `src/app/(dashboard)/network/settings/page.tsx` — Network settings
- `src/app/api/creators/me/route.ts` — Creator profile API
- `src/app/api/network/profile/route.ts` — Network profile API
- `src/app/api/brands/route.ts` — Brands search API
- `src/app/not-found.tsx` — Custom 404
- `src/app/error.tsx` — Custom 500
- `src/app/(dashboard)/loading.tsx` — Dashboard skeleton loader

**Files modified:** `src/app/api/orders/[id]/route.ts`, `src/app/api/orders/[id]/deliveries/[deliveryId]/review/route.ts`, `src/app/api/agency/brands/route.ts`, `src/app/api/orders/route.ts`, `src/app/(dashboard)/agency/brands/page.tsx`, `src/app/(dashboard)/agency/brands/[id]/page.tsx`, `src/app/(dashboard)/agency/orders/page.tsx`, `src/app/(dashboard)/agency/orders/new/page.tsx`, `src/app/(dashboard)/brand/orders/new/page.tsx`, `src/app/(dashboard)/creator/orders/[id]/page.tsx`, `src/components/layout/Sidebar.tsx`, `prisma/schema.prisma`, `prisma/seed.ts`, `package.json`

**PRs merged:** #27, #28, #29, #30, #31, #32, #33, #34, #35, #36

---

### March 31, 2026

**v1.0.0 → v1.0.1 — Security & Stability Hardening (10 Fixes)**

Comprehensive codebase audit identified 10 critical/high-priority issues. All fixes are non-structural (bug fixes + hardening).

1. **AI analysis JSON parsing crash** (`src/lib/ai.ts`): `JSON.parse()` on Claude API response had no try/catch — crashes if AI returns invalid JSON. Also fixed Anthropic API key defaulting to empty string `""` instead of failing gracefully. Wrapped both `analyzeCreator()` and `analyzeDelivery()` JSON parsing in try/catch with descriptive errors. Changed to lazy client initialization with API key validation.

2. **Stripe webhook secret crash** (`src/lib/stripe.ts`): `process.env.STRIPE_WEBHOOK_SECRET!` non-null assertion would throw unhandled error at runtime if env var not set. Added explicit null check with descriptive error message.

3. **Middleware missing role redirects** (`src/middleware.ts`): Second `dashboardMap` (lines 65-69) was missing `AGENCY` and `ACCOUNT_MANAGER` entries. Users with these roles would be redirected to "/" instead of their proper dashboard when accessing unauthorized routes. Added both missing mappings.

4. **Race condition in order acceptance** (`src/app/api/orders/[id]/accept/route.ts`): `maxCreators` count check and duplicate assignment check were outside the Prisma transaction — concurrent requests could exceed the limit. Moved both checks inside `$transaction` for atomicity.

5. **Race condition in delivery approval** (`src/app/api/orders/[id]/deliveries/[deliveryId]/review/route.ts`): `delivery.approved !== null` check was outside transaction — concurrent approve requests could both pass and double-process payments. Added re-check inside `$transaction`.

6. **Weak verification code entropy** (`src/app/api/creators/[id]/verify/route.ts`): Verification code used only 3 bytes (24 bits / ~16M possibilities) of randomness — brute-forceable. Increased to 16 bytes (128 bits).

7. **Hardcoded URLs in email templates** (`src/lib/email.ts`): All 6 email functions had URLs hardcoded to `https://www.foxolog.com/...`, breaking dev/staging environments. Extracted to `APP_URL` constant using `process.env.NEXT_PUBLIC_APP_URL` with production fallback.

8. **NotificationBell tab visibility** (`src/components/layout/NotificationBell.tsx`): 30-second polling interval ran even when browser tab was hidden, wasting resources. Added `visibilitychange` listener to pause polling when tab is hidden and resume + immediate fetch when tab becomes visible.

9. **Payment webhook idempotency** (`src/app/api/payments/webhook/route.ts`): Webhook events for `payment_intent.succeeded` and `payment_intent.payment_failed` could be processed multiple times with no deduplication. Added state checks before updates — only processes if order hasn't already been updated to that state or a more advanced state.

10. **File upload MIME validation** (`src/app/api/upload/route.ts`): Only checked client-sent `file.type` MIME header which can be easily spoofed. Added server-side magic byte validation for JPEG, PNG, GIF, and WebP file signatures.

**Files modified:** `src/lib/ai.ts`, `src/lib/stripe.ts`, `src/lib/email.ts`, `src/middleware.ts`, `src/app/api/orders/[id]/accept/route.ts`, `src/app/api/orders/[id]/deliveries/[deliveryId]/review/route.ts`, `src/app/api/creators/[id]/verify/route.ts`, `src/components/layout/NotificationBell.tsx`, `src/app/api/payments/webhook/route.ts`, `src/app/api/upload/route.ts`, `package.json`, `PROGRESS.md`

### March 31, 2026 (Session 2)

**v1.0.1 → v1.1.0 — Payment Architecture (Stripe + Payoneer)**

Complete payment flow implementation: Stripe for brand charges (escrow), Payoneer for creator payouts, platform credit system for refunds, and admin dispute resolution.

**Design decisions:**
- Brands pay at publish time (escrow via Stripe Checkout)
- Budget split per creator: `budget / maxCreators`
- Refunds issued as platform credit (not card refund) — simpler, no Stripe refund fees
- Disputes: funds held until admin resolves
- Platform fee determined by admin settings (`platformFeeRate`)
- Payoneer for ALL creator payouts (supports MENA + Turkey regions that Stripe doesn't)
- All payment code has dev-mode fallbacks — app works end-to-end without API keys

**Phase 1 — Schema changes:**
- `BrandCredit` model: brand refund wallet (id, brandId, amount, reason, orderId)
- `Creator` / `CreatorNetwork`: added `payoutMethod` (default "PAYONEER"), `payoneerPayeeId`
- `Order`: added `stripeCheckoutSessionId`, `creditApplied` (default 0), `amountCharged`
- `Transaction`: added `payoneerPayoutId`, `payoutMethod` (default "PAYONEER")

**Phase 2 — Brand checkout flow:**
- `POST /api/orders/[id]/checkout`: Creates Stripe Checkout Session when brand publishes. Calculates credit balance, applies credit, charges remaining via Stripe. If fully covered by credit, publishes directly. Dev mode: publishes without payment when STRIPE_SECRET_KEY missing.
- `OrderActions.tsx`: Rewritten — "Publish Order" → "Pay & Publish" button, fetches credit balance, shows credit info, redirects to Stripe Checkout or publishes directly.
- `AgencyOrderActions.tsx`: Updated to use same checkout flow instead of broken PUT-to-OPEN approach.
- Stripe webhook: Added `checkout.session.completed` handler — transitions order DRAFT→OPEN, sets paymentStatus HELD, applies credit deduction.

**Phase 3 — Creator payout flow (Payoneer):**
- `src/lib/payoneer.ts`: Full Payoneer Mass Payout API client — `registerPayee()`, `getPayeeStatus()`, `createPayout()`. Gracefully skips all API calls when PAYONEER_PARTNER_ID/PAYONEER_API_KEY not configured.
- `POST /api/payouts/onboard`: Creators/networks register with Payoneer. Dev mode returns success without actual registration.
- Updated `POST /api/orders/[id]/approve` and `POST /api/orders/[id]/deliveries/[deliveryId]/review`: Replaced Stripe Connect transfers with Payoneer payouts. Per-creator budget calculation, Transaction creation with `payoutMethod: "PAYONEER"`, non-blocking payout attempt.

**Phase 4 — Credit system:**
- `GET /api/brand/credits`: Returns brand's credit balance and history.
- `DELETE /api/orders/[id]`: Now issues BrandCredit when cancelling paid orders (status !== DRAFT && paymentStatus === HELD).
- Creator earnings page: Replaced Stripe Connect onboarding with Payoneer onboarding.

**Phase 5 — Dispute resolution:**
- `POST /api/admin/orders/[id]/resolve-dispute`: Admin-only endpoint with two resolution options:
  - `release_to_creator`: Calculates per-creator payout, creates Transaction, attempts Payoneer transfer, notifies both parties.
  - `credit_to_brand`: Creates BrandCredit record, cancels order, notifies both parties.

**Files created:** `src/lib/payoneer.ts`, `src/app/api/orders/[id]/checkout/route.ts`, `src/app/api/brand/credits/route.ts`, `src/app/api/payouts/onboard/route.ts`, `src/app/api/admin/orders/[id]/resolve-dispute/route.ts`

**Files modified:** `prisma/schema.prisma`, `package.json`, `src/app/(dashboard)/brand/orders/[id]/OrderActions.tsx`, `src/app/(dashboard)/brand/orders/[id]/page.tsx`, `src/app/(dashboard)/creator/earnings/page.tsx`, `src/app/(dashboard)/agency/brands/[id]/AgencyOrderActions.tsx`, `src/app/(dashboard)/agency/brands/[id]/page.tsx`, `src/app/(dashboard)/agency/orders/[id]/page.tsx`, `src/app/api/orders/[id]/route.ts`, `src/app/api/orders/[id]/approve/route.ts`, `src/app/api/orders/[id]/deliveries/[deliveryId]/review/route.ts`, `src/app/api/payments/webhook/route.ts`, `PROGRESS.md`

**Environment variables needed:**
- `STRIPE_SECRET_KEY` — Stripe API key (optional — dev mode works without it)
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret
- `PAYONEER_PARTNER_ID` — Payoneer Mass Payout partner ID (optional — dev mode works without it)
- `PAYONEER_API_KEY` — Payoneer API key (optional — dev mode works without it)
- `PAYONEER_API_URL` — Payoneer API URL (defaults to sandbox)

**Infrastructure needed after merge:**
- Run `prisma db push` to apply schema changes (auto-runs on Vercel build)
- Set Stripe and Payoneer env vars in Vercel when accounts are ready

---

### April 1, 2026

**v1.1.0 → v1.1.1 — Version Consistency & In-App Display (PR #46)**

Audited version numbers across the entire project and found `package.json` and `package-lock.json` stuck at `0.1.0` since initial release, despite the project being at v1.1.0 per PROGRESS.md. Also found no in-app version display anywhere.

**Changes:**
1. **package.json**: Updated version from `0.1.0` → `1.1.0` (now `foxolog` name from main)
2. **package-lock.json**: Updated version in both root and `packages[""]` entries
3. **`src/lib/constants.ts`** (new): Created `APP_VERSION` constant — single source of truth for in-app version display
4. **Sidebar footer**: Added subtle `v1.1.0` text pinned to bottom of dashboard sidebar (`text-xs text-gray-400`)
5. **Landing page footer**: Added faded version span next to copyright text (`text-xs opacity-50`)

**Versioning rule established:** Future version bumps require updating 3 places: `package.json`, `package-lock.json`, and `src/lib/constants.ts`.

**Files created:** `src/lib/constants.ts`

**Files modified:** `package.json`, `package-lock.json`, `src/components/layout/Sidebar.tsx`, `src/app/page.tsx`, `PROGRESS.md`

**PRs merged:** #46

---

### April 1, 2026 (Session 2)

**v1.1.1 → v1.2.0 — Comprehensive Codebase Audit (15 Fixes)**

Full audit of API routes, frontend, schema, and infrastructure. Targeted all HIGH and MEDIUM severity issues.

**Payment & Business Logic (Critical):**
1. **Double-payment race condition** (`approve/route.ts`): Added transaction-level re-check of `delivery.approved` before processing — prevents concurrent approval requests from issuing duplicate payouts
2. **Payment math for multi-creator orders** (`approve/route.ts`, `review/route.ts`): Changed from `budget / maxCreators` to `budget / actualCompletedAssignments` — creators now get fair share based on how many actually delivered
3. **Resolve-dispute null crash** (`resolve-dispute/route.ts`): Added empty assignments check, rewrote to loop through ALL assignments (not just `[0]`), creating transactions and payouts per creator

**Authorization & Security (High):**
4. **Account Manager order access** (`orders/[id]/route.ts`): Added brand assignment check — AMs can now only view orders for brands they manage via `AccountManagerBrand`
5. **ADMIN delivery review** (`deliveries/[deliveryId]/review/route.ts`): Added `ADMIN` to allowed roles list and authorization bypass
6. **Middleware admin API protection** (`middleware.ts`): Added explicit `/api/admin` route blocking for non-admin users at middleware level
7. **Register orphan user prevention** (`register/route.ts`): Moved TikTok username duplicate check before user creation to avoid orphaned User records on failure

**AI & Validation (High):**
8. **AI response Zod validation** (`ai.ts`): Added Zod schemas for both `analyzeCreator` and `analyzeDelivery` responses — validates structure before DB insert
9. **AI request timeout** (`ai.ts`): Added 30-second timeout via `Promise.race` — prevents hanging requests from blocking indefinitely

**Frontend (Medium):**
10. **Navbar/Sidebar sync** (`Navbar.tsx`): Added missing links — Creator: Tickets + Settings, Network: Settings, Admin: Agency Claims, Agency: Browse
11. **Content type form validation** (`register/page.tsx`): Added client-side check preventing creators from registering with zero content types selected

**Data & Infrastructure (Medium):**
12. **File upload extension validation** (`upload/route.ts`): Extension now derived from validated MIME type instead of user-supplied filename — prevents `.exe` files with fake image headers
13. **Scoring algorithm smoothing** (`scoring.ts`): Fixed discontinuous jump at 5% engagement (37.5→70 is now 30→65), smoother curve across all ranges
14. **DB indexes** (`schema.prisma`): Added 5 indexes — `OrderAssignment.networkId`, `Delivery(orderId, approved)`, `Order(status, createdAt)`, `SupportTicket.creatorId`
15. **Dispute ticket comment** (`dispute/route.ts`): Clarified that `creatorId` field stores the ticket opener (any role), not necessarily a Creator

**Files modified:** `src/app/api/orders/[id]/approve/route.ts`, `src/app/api/orders/[id]/deliveries/[deliveryId]/review/route.ts`, `src/app/api/orders/[id]/route.ts`, `src/app/api/admin/orders/[id]/resolve-dispute/route.ts`, `src/app/api/orders/[id]/dispute/route.ts`, `src/app/api/register/route.ts`, `src/app/api/upload/route.ts`, `src/lib/ai.ts`, `src/lib/scoring.ts`, `src/lib/constants.ts`, `src/components/layout/Navbar.tsx`, `src/middleware.ts`, `src/app/(auth)/register/page.tsx`, `prisma/schema.prisma`, `package.json`, `package-lock.json`, `PROGRESS.md`

**Infrastructure needed after merge:**
- Run `prisma db push` to apply new indexes (auto-runs on Vercel build)

---

### April 2, 2026

**v1.2.0 → v1.3.0 — TikTok OAuth Verification**

TikTok app approved but only Login Kit (Client Key + Secret) — no Research API access. Refactored verification to use OAuth-based ownership confirmation instead of bio-code + Research API.

**How it works:**
1. Creator clicks "Verify with TikTok" on profile page
2. Redirected to TikTok OAuth (Login Kit v2)
3. TikTok returns their username after authorization
4. System matches returned username against creator's `tiktokUsername` in DB
5. Match = verified (sets `verificationMethod: "OAUTH"`, pulls follower/likes/video metrics)

**Implementation:**
- **`src/lib/verify-state.ts`** (new): HMAC-signed state token utility for OAuth flow (creatorId + userId + tiktokUsername, 15-min expiry). Uses Node.js built-in `crypto` — zero new dependencies.
- **`POST /api/creators/[id]/verify-tiktok`** (new): Initiates verification — validates creator ownership, generates signed state, returns TikTok authorization URL.
- **`GET /api/verify-tiktok/callback`** (new): Handles TikTok OAuth callback — exchanges code for access token, fetches user info, matches username, marks creator as verified, updates metrics, redirects to profile with success/error params.
- **`VerificationBanner.tsx`** (updated): "Verify with TikTok" button as primary method (black TikTok-branded button). Reads `?verify=success|error&reason=...` query params from callback redirect. Detailed error messages for each failure mode (username mismatch shows both usernames, expired session, denied access, etc.). Bio-code method preserved as secondary fallback.

**Security:**
- State token is HMAC-SHA256 signed with NEXTAUTH_SECRET — tamper-proof
- 15-minute expiry on state token
- User session checked on both initiate and callback
- UserId in state must match logged-in user (prevents CSRF)

**Environment variables needed:**
- `AUTH_TIKTOK_ID` — TikTok app Client Key
- `AUTH_TIKTOK_SECRET` — TikTok app Client Secret

**TikTok Developer Portal setup:**
- Add redirect URI: `https://www.foxolog.com/api/verify-tiktok/callback`

**Files created:** `src/lib/verify-state.ts`, `src/app/api/creators/[id]/verify-tiktok/route.ts`, `src/app/api/verify-tiktok/callback/route.ts`

**Files modified:** `src/app/(dashboard)/creator/profile/VerificationBanner.tsx`, `src/lib/constants.ts`, `package.json`, `package-lock.json`, `PROGRESS.md`

---

**v1.3.0 → v1.4.0 — UI Component Library + Design Consistency**

Comprehensive UI/UX audit identified massive code duplication (status colors, tier labels, role colors copied across 30+ pages), inconsistent focus ring colors (mix of indigo, orange-500, brand hex), and missing UX patterns (no toasts, no confirm dialogs, no empty states). Built a reusable component library and wired it across the entire app.

**New Components Created (`src/components/ui/`):**

1. **`Badge.tsx`** — 6 badge variants: `StatusBadge` (order status), `TierBadge` (creator tier), `RoleBadge` (user role), `OrderTypeBadge` (SHORT_VIDEO/LIVE/COMBO), `TicketStatusBadge`, `PaymentStatusBadge`. All read from shared constants.

2. **`Button.tsx`** — 4 variants (primary/secondary/danger/ghost), 3 sizes (sm/md/lg), built-in loading spinner state. All use brand orange `#d4772c`.

3. **`Toast.tsx`** — Toast notification system with context provider. 3 types (success/error/info), auto-dismiss after 4 seconds, slide-in animation, dismiss button. Wired into app via `ToastProvider` in `providers.tsx`.

4. **`ConfirmDialog.tsx`** — Modal confirmation dialog for destructive actions. Supports danger/primary variants, async confirm handler with loading state, backdrop click to cancel.

5. **`EmptyState.tsx`** — Reusable empty state component with icon, title, description, and optional action CTA. Replaces bare "No X found" text.

6. **`FormField.tsx`** — 3 field types: `InputField`, `TextareaField`, `SelectField`. Consistent label styling, error message display, required asterisk. All use brand orange focus ring.

**Shared Constants (`src/lib/ui-constants.ts`):**
- `ORDER_STATUS_COLORS` + `ORDER_STATUS_LABELS` — replaces 20 inline copies
- `TIER_LABELS` — replaces 6 inline copies
- `ROLE_COLORS` + `ROLE_LABELS` — replaces inline copies
- `ORDER_TYPE_COLORS` + `ORDER_TYPE_LABELS` — replaces 5 inline copies
- `TICKET_STATUS_COLORS`, `PAYMENT_STATUS_COLORS`

**Pages Updated (30+ files):**
- Removed all inline `statusColors`, `tierLabels`, `roleColors`, `typeStyles`, `typeLabels` objects
- Replaced inline `<span>` badges with component calls (`StatusBadge`, `TierBadge`, etc.)
- Standardized all focus rings from `indigo-500` / `orange-500` to brand `#d4772c`
- Added toast animation CSS to `globals.css`

**Files created:** `src/lib/ui-constants.ts`, `src/components/ui/Badge.tsx`, `src/components/ui/Button.tsx`, `src/components/ui/Toast.tsx`, `src/components/ui/ConfirmDialog.tsx`, `src/components/ui/EmptyState.tsx`, `src/components/ui/FormField.tsx`

**Files modified:** `src/app/providers.tsx`, `src/app/globals.css`, `package.json`, `package-lock.json`, `src/lib/constants.ts`, + 30 dashboard page files (badge + focus ring replacements)

---

### April 3, 2026

**v1.4.0 → v1.5.0 — UX Polish & Brand Consistency**

Comprehensive UX improvements wiring up existing but unused UI components, eliminating browser-native dialogs, adding loading states, and standardizing brand colors.

**1. Toast Notifications (31 replacements across 12 files):**
- Replaced all `alert()` calls with `useToast()` hook across every client component
- Files: AdminOrderActions, AdminUsers, BrandOrderActions, BrandDeliveryActions, BrandNewOrder, CreatorAcceptOrder, CreatorDeliveryForm, CreatorAiInsights, AgencyOrderActions, AgencyNewOrder
- Success/error/info toasts with auto-dismiss and slide-in animation

**2. ConfirmDialog for Destructive Actions (3 replacements across 3 files):**
- AdminOrderActions: Force Complete + Cancel Order now show confirmation modal
- BrandOrderActions: Cancel Order shows confirmation modal
- AgencyOrderActions: Cancel Order shows confirmation modal
- All use the existing ConfirmDialog component with danger variant

**3. LoadingSpinner Component (new + 7 replacements):**
- Created `src/components/ui/LoadingSpinner.tsx` — animated spinner with customizable message
- Replaced plain "Loading..." text in: dashboard layout, admin users, admin orders, admin settings, admin agency-brands, brand settings, creator AI insights

**4. EmptyState Component (6 page-level replacements):**
- Wired existing EmptyState component into: admin orders, admin users, admin agency-brands, brand orders (with CTA), brand browse, agency browse
- Each with contextual icon (FileText, Users, Link2), title, and description

**5. Sidebar Icons (1 file, all roles):**
- Added Lucide icons to every sidebar nav link across all 6 roles
- Icon map: Orders→ShoppingBag, Earnings→DollarSign, Tickets→MessageCircle, Profile→User, Settings→Settings, Creators→Users, Browse→Search, Brands→Building2, Analytics→BarChart3, Transactions→CreditCard, Notes→StickyNote, Agency Claims→Link2

**6. Brand Color Consistency (19 files, 0 indigo remaining):**
- Replaced all `bg-indigo-600/hover:bg-indigo-700` CTA buttons → `bg-[#d4772c]/hover:bg-[#b8632a]`
- Replaced all `bg-indigo-600 text-white` active filter pills → `bg-[#d4772c] text-white`
- Replaced all `bg-indigo-100 text-indigo-600/700` avatar/score badges → `bg-orange-100 text-[#d4772c]`
- Replaced notification bell unread indicators → orange-based
- **Zero** `bg-indigo-` references remain in the codebase

**Files created:** `src/components/ui/LoadingSpinner.tsx`

**Files modified:** `src/components/layout/Sidebar.tsx`, `src/components/layout/NotificationBell.tsx`, `src/app/(dashboard)/admin/orders/[id]/AdminOrderActions.tsx`, `src/app/(dashboard)/admin/orders/page.tsx`, `src/app/(dashboard)/admin/users/page.tsx`, `src/app/(dashboard)/admin/agency-brands/page.tsx`, `src/app/(dashboard)/admin/settings/page.tsx`, `src/app/(dashboard)/admin/tickets/[id]/page.tsx`, `src/app/(dashboard)/brand/orders/[id]/OrderActions.tsx`, `src/app/(dashboard)/brand/orders/[id]/DeliveryActions.tsx`, `src/app/(dashboard)/brand/orders/new/page.tsx`, `src/app/(dashboard)/brand/orders/page.tsx`, `src/app/(dashboard)/brand/orders/OrderStatusFilter.tsx`, `src/app/(dashboard)/brand/browse/page.tsx`, `src/app/(dashboard)/brand/browse/[id]/page.tsx`, `src/app/(dashboard)/brand/settings/page.tsx`, `src/app/(dashboard)/creator/orders/AcceptOrderButton.tsx`, `src/app/(dashboard)/creator/orders/[id]/DeliveryForm.tsx`, `src/app/(dashboard)/creator/orders/[id]/page.tsx`, `src/app/(dashboard)/creator/profile/AiInsights.tsx`, `src/app/(dashboard)/creator/profile/RefreshTikTokButton.tsx`, `src/app/(dashboard)/creator/settings/page.tsx`, `src/app/(dashboard)/agency/brands/[id]/AgencyOrderActions.tsx`, `src/app/(dashboard)/agency/orders/new/page.tsx`, `src/app/(dashboard)/agency/orders/[id]/page.tsx`, `src/app/(dashboard)/agency/browse/page.tsx`, `src/app/(dashboard)/agency/browse/[id]/page.tsx`, `src/app/(dashboard)/network/creators/page.tsx`, `src/app/(dashboard)/network/creators/add/page.tsx`, `src/app/(dashboard)/network/orders/[id]/page.tsx`, `src/app/(dashboard)/network/settings/page.tsx`, `src/app/(dashboard)/layout.tsx`, `src/lib/constants.ts`, `package.json`, `package-lock.json`, `PROGRESS.md`

---

**v1.5.0 → v1.6.0 — Mobile Navigation, Dashboard Home Pages, Landing Page Polish**

**1. Mobile Sidebar Drawer:**
- Extracted `SidebarNav` shared component and `MobileSidebar` slide-out drawer from Sidebar
- Dashboard layout now shows a sticky "Menu" button on mobile (`lg:hidden`) that opens the sidebar as an overlay drawer
- Backdrop click + link click both close the drawer
- Smooth `translate-x` CSS transition

**2. Dashboard Home Pages (4 new pages):**
- **Creator** (`/creator`): Active orders, completed orders, total earnings, available orders + quick actions (View Orders, Browse Available, My Profile, Submit Ticket)
- **Brand** (`/brand`): Active campaigns, completed, total spent, credit balance, pending reviews + quick actions (Create Order, Browse Creators, Settings)
- **Network** (`/network`): Total creators, active orders, completed orders, network earnings + quick actions
- **Agency** (`/agency`): Managed brands, active orders, completed orders, total earnings + quick actions
- All use `Promise.all` for parallel data fetching, Lucide icons, responsive stat card grids
- Added "Dashboard" link to Sidebar for Creator, Brand, Network, Agency roles

**3. Landing Page Polish:**
- Replaced numbered step badges with Lucide icons (UserPlus, FileText, Banknote) in "How It Works"
- Added Lucide icons (Sparkles, Shield, Users, BarChart3) to "Why Foxolog?" feature cards
- Added hover animations: cards lift with shadow, icons invert colors on hover
- Added subtitles under section headings for better hierarchy
- Added arrow icon to primary CTA buttons
- Extracted steps/features into typed arrays for cleaner JSX

**Files created:** `src/app/(dashboard)/creator/page.tsx`, `src/app/(dashboard)/brand/page.tsx`, `src/app/(dashboard)/network/page.tsx`, `src/app/(dashboard)/agency/page.tsx`

**Files modified:** `src/components/layout/Sidebar.tsx`, `src/app/(dashboard)/layout.tsx`, `src/app/page.tsx`, `src/lib/constants.ts`, `package.json`, `package-lock.json`, `PROGRESS.md`

---

**v1.9.4 → v2.0.0 — Full Multi-Language i18n & RTL Support**

**1. i18n Infrastructure (next-intl v4):**
- Installed `next-intl` v4 with `[locale]` dynamic route segment pattern
- All pages moved under `src/app/[locale]/` with locale-aware routing
- Middleware (`src/middleware.ts`) detects locale from Accept-Language header, cookies, and URL prefix
- `localePrefix: "as-needed"` — English has no prefix, others get `/ar/`, `/tr/`, `/fr/`, `/es/`
- Language switcher component in Navbar for runtime locale switching
- Default locale locked to user preferences via cookie persistence

**2. Full Translation Files (5 languages, 660 keys each):**
- `messages/en.json` — English (source, 18 namespaces, 660 keys)
- `messages/ar.json` — Arabic (full translation)
- `messages/tr.json` — Turkish (full translation)
- `messages/fr.json` — French (full translation)
- `messages/es.json` — Spanish (full translation)
- Namespaces: landing, auth, nav, sidebar, notifications, common, errors, creator, brand, network, agency, admin, orders, tickets, verification, ai, browse, deck

**3. All Pages Wired with Translation Hooks:**
- 55+ page/component files wired with `useTranslations()` (client) or `getTranslations()` (server)
- Landing page, auth (login/register/onboarding), error/not-found pages
- All dashboard pages: creator, brand, network, agency, admin, account-manager
- All order detail pages, browse pages, earnings pages, settings pages
- Shared components: Navbar, Sidebar, NotificationBell, TicketsList, NewTicketForm
- Deck (presentation) page fully translated

**4. RTL Support for Arabic:**
- `dir="rtl"` attribute set dynamically on layout based on locale
- RTL CSS overrides in `globals.css` for sidebar positioning, text alignment, arrow transitions
- Automatic layout flip for Arabic locale

**5. Version Bump:**
- Version bumped from 1.9.4 → 2.0.0 in `package.json`, `package-lock.json`, and `src/lib/constants.ts`

**Files created:** `messages/ar.json`, `messages/tr.json`, `messages/fr.json`, `messages/es.json`, `src/components/layout/LanguageSwitcher.tsx`

**Files modified:** 55+ files across `src/app/[locale]/`, `src/components/`, `messages/en.json`, `src/middleware.ts`, `src/app/globals.css`, `src/lib/constants.ts`, `package.json`, `package-lock.json`, `PROGRESS.md`

---

**v2.0.0 → v3.0.0 — Production Infrastructure, Analytics Charts, Mobile Optimization, Rate Limiting, Testing**

**1. Vercel Blob File Storage:**
- Replaced local `fs.writeFile` to `/uploads` directory with `@vercel/blob` `put()` API
- Upload route now returns full Vercel Blob CDN URLs
- Added `*.public.blob.vercel-storage.com` to Next.js image remote patterns
- Preserved magic byte validation from v1.0.1 security hardening

**2. Vercel Cron Jobs (2 new scheduled tasks):**
- `/api/cron/refresh-metrics` — daily at 3 AM UTC, batch-refreshes up to 50 creators with metrics older than 7 days
- `/api/cron/expire-orders` — daily at 4 AM UTC, auto-cancels OPEN/ASSIGNED orders past `expiresAt`, refunds HELD payments
- `vercel.json` with cron schedule configuration
- `CRON_SECRET` Bearer token auth on both endpoints

**3. Recharts Analytics Dashboard (4 charts):**
- Order Status Pie Chart, User Role Bar Chart
- Order Trend Bar Chart + Revenue Trend Area Chart (last 6 months)
- Enhanced analytics API with monthly time-series aggregation

**4. Mobile Optimization (20+ pages):**
- Responsive padding (`p-3 sm:p-6`) across all dashboard pages
- Responsive headings (`text-2xl sm:text-3xl`)
- Table `min-w-[600px]` for horizontal scroll on mobile

**5. API Rate Limiting:**
- Middleware-level: 60 req/min per IP on all API routes
- Auth routes: 5 req/min, Upload: 10 req/min per user
- Returns HTTP 429 with `Retry-After` header

**6. Testing Infrastructure:**
- Vitest + @testing-library/react + jsdom
- 21 tests across 3 suites (scoring, utils, rate-limit)
- `npm run test` / `npm run test:watch`

---

**v3.0.0 → v3.0.1 — TikTok App Review Compliance (ToS / Privacy Policy Links)**

**Context:** TikTok rejected the production app submission with the note: *"Missing Terms of Service, ToS needs to be easily accessible from the homepage. Missing Privacy Policy, PP needs to be easily accessible from the homepage."* The `/terms` and `/privacy` pages already existed (added in v0.x), but the landing page redesign in v1.9+ inadvertently dropped the footer links — only Login / Register were left.

**1. Landing page footer:**
- Added `Terms` and `Privacy` links to the homepage footer alongside Login / Register
- Footer link group switched to `flex-wrap` so the four links wrap cleanly on mobile
- Both links route to existing `/terms` and `/privacy` pages (already in `publicRoutes` whitelist in `src/middleware.ts`)

**2. Auth pages (login + register):**
- Added a small `Terms · Privacy` link row beneath the "no account / has account" prompt on both login and register pages
- Brand-orange hover state, gray default to stay subtle

**3. i18n keys (5 locales):**
- New `landing.footer_terms` and `landing.footer_privacy` keys
- Translated across `messages/en.json`, `ar.json`, `tr.json`, `fr.json`, `es.json`
- Auth pages reuse the `landing` namespace via a second `useTranslations("landing")` hook to avoid duplicating keys

**4. Version bump:**
- `3.0.0 → 3.0.1` in `package.json`, `package-lock.json`, `src/lib/constants.ts` (`APP_VERSION`)
- Classified as a minor fix (+0.0.1) per versioning rules — no logic / schema / architecture change, only adding nav links to existing pages

**Files modified:** `src/app/[locale]/page.tsx`, `src/app/[locale]/(auth)/login/page.tsx`, `src/app/[locale]/(auth)/register/page.tsx`, `messages/en.json`, `messages/ar.json`, `messages/tr.json`, `messages/fr.json`, `messages/es.json`, `src/lib/constants.ts`, `package.json`, `package-lock.json`, `PROGRESS.md`

**Next step (manual):** Resubmit the foxolog app for TikTok review — the Website URL field already points to https://www.foxolog.com which now has the required ToS/PP links visible in the footer.

---

**v3.0.1 → v3.0.2 — Lint Baseline Cleanup (0 errors)**

**Context:** Establishing a green baseline before tackling future refactors. `npm test` already passed (21/21), `tsc --noEmit` was clean, but `npm run lint` reported **232 errors + 17 warnings**. Investigation showed:
- 228 errors were spurious `@next/next/no-html-link-for-pages` — that rule is for the legacy Pages Router and misfires on every `<Link>` / `<a>` under `src/app/[locale]/`.
- 4 errors were real React 19 / React Compiler purity issues.
- 17 warnings were minor (mostly unused vars + a few `<img>` tags); left for a future cosmetic cleanup.

**1. Disable spurious Pages-Router rule:**
- Added an override in `eslint.config.mjs` turning off `@next/next/no-html-link-for-pages`. App Router doesn't need it.

**2. NotificationBell — proper React 19 fixes (`src/components/layout/NotificationBell.tsx`):**
- `react-hooks/immutability`: replaced `window.location.href = notification.link` in the click handler with `useRouter().push(notification.link)`.
- `react-hooks/purity`: removed the `Date.now()` call from `timeAgo()` (which was called during render). Added a `now` state initialised to `Date.now()` and a small `useEffect` that ticks `setNow(Date.now())` every 30 s. `timeAgo()` now uses `now - new Date(dateStr).getTime()` and is a pure function of state.
- Added a single targeted `// eslint-disable-next-line react-hooks/set-state-in-effect` on the polling `fetchNotifications()` call inside the existing notification-fetch effect, with a comment explaining why it's a false positive (this is the canonical "subscribe to external system" effect pattern).

**3. Targeted disables on legitimate one-shot effects:**
- `src/app/[locale]/(dashboard)/creator/profile/VerificationBanner.tsx:54-78` — the OAuth-callback effect reads `searchParams` and syncs them into local state (success / error). It runs once on mount + when params change and doesn't cascade. Added eslint-disable comments + an explanatory block comment.
- `src/app/[locale]/deck/page.tsx:734-741` — the sessionStorage-read effect that flips `unlocked` post-mount. A lazy `useState` initializer can't be used because sessionStorage isn't available during SSR. Added eslint-disable + explanatory comment.

**4. Verification:**
- `npm run lint` → **0 errors** (down from 232), 19 warnings remaining (cosmetic only)
- `npm test` → 21/21 passing
- `npx tsc --noEmit` → clean

**5. Version bump:**
- `3.0.1 → 3.0.2` in `package.json`, `package-lock.json`, `src/lib/constants.ts` (`APP_VERSION`)
- Classified as a minor fix (+0.0.1) per versioning rules — no logic / schema / architecture change.

**Files modified:** `eslint.config.mjs`, `src/components/layout/NotificationBell.tsx`, `src/app/[locale]/(dashboard)/creator/profile/VerificationBanner.tsx`, `src/app/[locale]/deck/page.tsx`, `src/lib/constants.ts`, `package.json`, `package-lock.json`, `PROGRESS.md`

**Out of scope (deferred to a future cleanup PR):**
- 19 remaining lint warnings: unused vars (`fetchWithAuth` in `src/lib/tiktok.ts`, `request` params in 3 API routes, `perCreatorBudget` in approve route, `setShowBioCode` in VerificationBanner) and a few `<img>` tags that should become `next/image`. None are bugs.

---

**v3.0.2 → v3.1.0 — Playwright E2E Smoke Tests**

**Context:** The TikTok rejection in v3.0.1 happened because the v1.9+ landing page redesign silently dropped the footer ToS / Privacy links — there was no test to catch it. This PR adds a Playwright smoke suite that locks in those links and a few other critical landing-page invariants so the same regression can never sneak through again.

**1. New devDependency:**
- `@playwright/test ^1.59.1`

**2. Configuration (`playwright.config.ts`):**
- `testDir: ./e2e`, `chromium` only
- `baseURL` defaults to `https://www.foxolog.com`; override with `BASE_URL` env var (e.g. `BASE_URL=http://localhost:3000` for local dev, or a Vercel preview URL)
- `forbidOnly` + retries enabled in CI
- `reporter: list` for clean console output

**3. Smoke tests (`e2e/smoke.spec.ts`, 8 tests):**
- **`landing › loads and renders the hero`** — basic page-load + title + CTA visible
- **`landing › footer exposes ToS + Privacy links (TikTok review compliance)`** ⭐ — the regression guard. Asserts both `a[href$="/terms"]` and `a[href$="/privacy"]` are visible inside `<footer>`.
- **`landing › clicking footer Terms link navigates to /terms`** — full nav assertion + heading
- **`landing › clicking footer Privacy link navigates to /privacy`** — same for Privacy
- **`legal pages › /terms loads with the Terms of Service heading`**
- **`legal pages › /privacy loads with the Privacy Policy heading`**
- **`auth pages › /login renders and exposes Terms + Privacy links`**
- **`auth pages › /register renders and exposes Terms + Privacy links`**

**4. New npm scripts:**
- `npm run test:e2e` — run the smoke suite
- `npm run test:e2e:install` — first-time chromium browser download (~150 MB)

**5. Vitest isolation (`vitest.config.ts`):**
- Added `exclude: ["**/node_modules/**", "**/dist/**", "e2e/**"]` so Vitest doesn't try to load the Playwright spec (which uses `@playwright/test` instead of `vitest`)

**6. `.gitignore`:**
- Added Playwright artifact directories: `/test-results`, `/playwright-report`, `/blob-report`, `/playwright/.cache`

**7. Verification:**
- `npx playwright test --list` → all 8 tests parse correctly
- `npm test` → 21/21 still passing (Vitest correctly skips `e2e/`)
- `npx tsc --noEmit` → clean
- `npm run lint` → 0 errors (19 cosmetic warnings, unchanged)
- ⚠️ Could not run the actual smoke suite from the dev sandbox (network blocks foxolog.com + chromium download). Tests should be run by maintainer locally before merge: `npm run test:e2e:install && npm run test:e2e`

**8. Version bump:**
- `3.0.2 → 3.1.0` in `package.json`, `package-lock.json`, `src/lib/constants.ts` (`APP_VERSION`)
- Classified as **+0.1.0 minor feature** per versioning rules — adds new test infrastructure (devDep + scripts + test suite + config), not just a fix.

**9. GitHub Actions CI (`.github/workflows/smoke.yml`):**
- Runs the Playwright suite automatically against `https://www.foxolog.com` so the maintainer doesn't need a local dev env
- **Triggers:**
  - `push` to `main` — with a 90 s `sleep` to give Vercel time to finish deploying the new commit before hitting prod
  - `schedule` — daily at 06:00 UTC (catches non-code regressions: DB outages, Vercel issues, third-party breakage)
  - `workflow_dispatch` — manual "Run workflow" button in the Actions tab, with an optional `base_url` input to point at a Vercel preview URL
- Caches `~/.cache/ms-playwright` between runs (keyed on `package-lock.json`) so chromium isn't re-downloaded every time
- Uploads the Playwright HTML report as a workflow artifact on failure (14-day retention)
- `playwright.config.ts` switches to a multi-reporter (`list` + `html`) when `CI=true` so the artifact actually exists

**Files added:** `playwright.config.ts`, `e2e/smoke.spec.ts`, `.github/workflows/smoke.yml`

**Files modified:** `package.json`, `package-lock.json`, `vitest.config.ts`, `.gitignore`, `src/lib/constants.ts`, `PROGRESS.md`

**Future enhancements (not in this PR):**
- Add coverage for authenticated flows (login, order creation, delivery review) — needs a seeded test account
- Wire a Vercel deployment-finished webhook to `repository_dispatch` so the smoke run fires the instant the deploy is live (instead of relying on the 90 s sleep)

---

**v3.1.0 → v3.1.1 — i18n Coverage Audit**

**Context:** The v2.0.0 next-intl migration translated most of the app, but a handful of surfaces — added later or overlooked — still rendered hardcoded English in all 5 locales. This PR closes those gaps and adds the missing keys to `en/ar/tr/fr/es`.

**1. Audit:** A subagent swept the codebase looking for raw English strings inside JSX, hardcoded `aria-label`s, English error messages thrown to UI, and English fallbacks like `?? "..."`. Six files were flagged as the only remaining offenders (the four v1.9.x dashboard home pages were verified clean).

**2. New translation keys (all 5 locales: en/ar/tr/fr/es):**
- `common.contact`, `common.error_generic`, `common.aria_change_language`, `common.aria_open_navigation`, `common.menu`
- `tickets.error_create_failed`, `tickets.order_subject_prefix` (with `{title}` placeholder), `tickets.messages_count` (ICU plural)
- New `dashboard` namespace: `dashboard.loading`
- New `account_manager` namespace: `heading`, `section_brands`, `empty_brands`, `section_agencies`, `empty_agencies`, `no_industry`, `label_orders`, `label_managed_brands`, `priority_vip`, `priority_high`, `priority_normal`

**3. Wired files:**
- `src/app/[locale]/(dashboard)/account-manager/clients/page.tsx` — server component, added `getTranslations("account_manager")` + `getTranslations("common")`. Replaced 13 hardcoded strings (page heading, section headings, empty states, "VIP/High/Normal" priority badges, "No industry", "Contact:", "Orders:", "Managed Brands:").
- `src/components/ui/ConfirmDialog.tsx` — client component, added `useTranslations("common")`. Cancel button + "Processing..." loading state + default `confirmLabel` now translated. Existing `confirmLabel` prop still wins when passed.
- `src/app/[locale]/(dashboard)/layout.tsx` — client component, added `useTranslations("dashboard")` + `useTranslations("common")`. "Loading dashboard...", `aria-label="Open navigation"`, and "Menu" label now translated.
- `src/components/layout/LanguageSwitcher.tsx` — added `useTranslations("common")` for `aria-label="Change language"` (the language names themselves stay hardcoded — they're meant to render in their own language).
- `src/components/tickets/NewTicketForm.tsx` — added `useTranslations("common")`. Initial subject prefix `Issue with order: ${orderTitle}` now uses ICU `t("order_subject_prefix", { title })`. "Failed to create ticket" and "Something went wrong" fallbacks now translated.
- `src/components/tickets/TicketsList.tsx` — replaced inline `count === 1 ? "message" : "messages"` ternary with ICU plural `t("messages_count", { count })`, which gives every locale (including Arabic with its 6 plural forms) correct grammatical agreement.

**4. Why ICU plural for `messages_count`:** Hand-rolled ternaries silently break in languages with non-binary plural rules. Using `{count, plural, one {# message} other {# messages}}` lets next-intl pick the right form per locale — Arabic in particular gets a full `zero/one/two/few/many/other` rule set.

**5. Verification:**
- All 5 locale files validated as parseable JSON
- `npx tsc --noEmit` → clean
- `npm run lint` → 0 errors
- `npm test` → 21/21 passing
- `npx playwright test --list` → 8/8 still parsing

**6. Version bump:** `3.1.0 → 3.1.1` in `package.json`, `package-lock.json`, `src/lib/constants.ts` (`APP_VERSION`). Classified as **+0.0.1 patch** per versioning rules — closes leftover gaps from the v2.0.0 migration, no new feature.

**Files modified:** `messages/{en,ar,tr,fr,es}.json`, `src/app/[locale]/(dashboard)/account-manager/clients/page.tsx`, `src/components/ui/ConfirmDialog.tsx`, `src/app/[locale]/(dashboard)/layout.tsx`, `src/components/layout/LanguageSwitcher.tsx`, `src/components/tickets/NewTicketForm.tsx`, `src/components/tickets/TicketsList.tsx`, `src/lib/constants.ts`, `package.json`, `package-lock.json`, `PROGRESS.md`

---

**v3.1.1 → v3.2.0 — shadcn/ui Foundation (PR #4a)**

**Context:** First slice of the shadcn/ui migration. The repo already had `components.json`, the CSS theme tokens in `globals.css`, and the `cn()` helper in `src/lib/utils.ts` — but **zero actual primitives**. Every UI component (`Button`, `ConfirmDialog`, `Toast`, etc.) was hand-rolled. This PR installs the missing pieces, scaffolds two primitives, and migrates one consumer as proof of concept.

**Strategy:** Split the migration into multiple PRs to keep each one reviewable. This PR is the foundation; future PRs will incrementally swap form fields, tables, dropdowns, etc.

**1. New dependencies:**
- `@radix-ui/react-dialog ^1.1.15` — headless dialog primitive
- `@radix-ui/react-slot ^1.2.4` — for `<Button asChild>` polymorphism
- `tw-animate-css ^1.4.0` — Tailwind v4 animation utility (replaces `tailwindcss-animate` for v4 codebases)

(`clsx`, `tailwind-merge`, `class-variance-authority` were already installed.)

**2. CSS:**
- Added `@import "tw-animate-css";` to `src/app/globals.css` so `data-[state=open]:animate-in` etc. resolve

**3. New primitives:**
- `src/components/ui/button.tsx` — shadcn new-york button with `cva` variants (`default`, `destructive`, `outline`, `secondary`, `ghost`, `link`) and sizes (`default`, `sm`, `lg`, `icon`). Default variant uses the brand orange `#d4772c`. Supports `asChild` via Radix Slot.
- `src/components/ui/dialog.tsx` — full shadcn dialog primitive set: `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`, `DialogClose`, `DialogOverlay`, `DialogPortal`. Includes the standard close (X) button, fade/zoom animations driven by Radix `data-state`, and a backdrop overlay.

**4. Removed:**
- `src/components/ui/Button.tsx` — old PascalCase hand-rolled button. Was unused (zero imports across the codebase) and would have caused a case-insensitive filename collision with the new lowercase `button.tsx` on macOS/Windows. Safe to delete.

**5. Migrated component (proof of concept):**
- `src/components/ui/ConfirmDialog.tsx` — rewritten on top of `Dialog` + `Button` from the new primitives. Public API unchanged: same props (`open`, `onConfirm`, `onCancel`, `title`, `description`, `confirmLabel?`, `confirmVariant?`, `icon?`), so the 3 existing call sites (`brand/orders/[id]/OrderActions.tsx`, `agency/brands/[id]/AgencyOrderActions.tsx`, `admin/orders/[id]/AdminOrderActions.tsx`) need zero changes. Now wires `onCancel` into Radix's `onOpenChange` so ESC and clicking the overlay also dismiss correctly — both small wins the old hand-rolled version had to implement manually.

**6. Verification:**
- `npx tsc --noEmit` → clean
- `npm run lint` → 0 errors
- `npm test` → 21/21 passing
- `npx playwright test --list` → 8/8 still parsing

**7. Version bump:** `3.1.1 → 3.2.0` in `package.json`, `package-lock.json`, `src/lib/constants.ts`. Classified as **+0.1.0 minor** per versioning rules — adds new dependencies and primitives, even though no user-facing feature changes.

**8. Future PRs (#4b, #4c, ...):**
- Form primitives: `input`, `label`, `textarea`, `select` → migrate `FormField`, login/register, brand settings, new-order forms
- Layout primitives: `card`, `tabs` → migrate dashboard cards
- Feedback primitives: `toast` (replacing the custom `Toast.tsx`), `alert`
- Navigation: `dropdown-menu`, `popover` → migrate navbar user menu, language switcher
- Data display: `table`, `pagination` → migrate admin tables, replace custom `Pagination.tsx`

**Files added:** `src/components/ui/button.tsx`, `src/components/ui/dialog.tsx`

**Files removed:** `src/components/ui/Button.tsx`

**Files modified:** `src/app/globals.css`, `src/components/ui/ConfirmDialog.tsx`, `package.json`, `package-lock.json`, `src/lib/constants.ts`, `PROGRESS.md`

---

**v3.2.0 → v3.3.0 — shadcn/ui Form Primitives (PR #4b)**

**Context:** Second slice of the shadcn/ui migration. Adds the three form primitives (`Input`, `Label`, `Textarea`) and migrates the highest-traffic form surfaces: login, register, and the support ticket form.

**1. New dependency:**
- `@radix-ui/react-label ^2.1.x` — used by the `Label` primitive for proper click-to-focus semantics

**2. New primitives (new-york style):**
- `src/components/ui/input.tsx` — standard input with brand-orange focus ring, `aria-invalid` styling, `disabled:*` states, and `file:*` classes for file inputs
- `src/components/ui/label.tsx` — Radix label with `peer-disabled` support and `group-data-[disabled=true]` for compound form components
- `src/components/ui/textarea.tsx` — auto-resizing textarea (`field-sizing-content`) matching the input's visual language

**3. Removed:**
- `src/components/ui/FormField.tsx` — old hand-rolled `InputField` / `TextareaField` / `SelectField` wrappers. Verified unused (zero imports across the codebase) so safe to delete without migration.

**4. Migrated surfaces:**
- **`src/app/[locale]/(auth)/login/page.tsx`** — raw `<label>` + `<input>` + `<button>` blocks replaced with `Label` + `Input` + `Button`. Google and TikTok SSO buttons also use `Button` (outline variant and custom black override respectively). `login_submit_loading` + `login_submit` still wired correctly.
- **`src/app/[locale]/(auth)/register/page.tsx`** — same migration across all 4 role-specific branches (CREATOR with TikTok + content types, NETWORK, BRAND with industry, AGENCY with website). 10+ input fields and 3+ buttons migrated. Kept the custom role-selector and content-type toggles as-is — they're bespoke multi-select pills, not form fields, and belong to a future layout-primitives PR.
- **`src/components/tickets/NewTicketForm.tsx`** — subject `Input`, description `Textarea`, and cancel/submit `Button`s. The cancel button uses `<Button asChild>` wrapping a `<Link>` — demonstrates the `asChild` pattern from the Button primitive. `aria-invalid` now drives the error-state styling declaratively instead of a manual class toggle.

**5. `aria-invalid` wiring:** every migrated field now sets `aria-invalid={!!fieldErrors.foo}`. The `Input` / `Textarea` primitives read this via `aria-invalid:border-red-500 aria-invalid:ring-red-500/20`, so the red error state is now a free side effect of the existing validation logic — no more hand-applied conditional class strings.

**6. Verification:**
- `npx tsc --noEmit` → clean
- `npm run lint` → 0 errors
- `npm test` → 21/21 passing
- `npx playwright test --list` → 8/8 still parsing (the `/login` and `/register` regression guards still target `footer a[href$="/terms"]` which is unaffected by the form migration)

**7. Version bump:** `3.2.0 → 3.3.0` in `package.json`, `package-lock.json`, `src/lib/constants.ts`. **+0.1.0 minor** — adds a new dep and 3 new primitives.

**8. Still hand-rolled (future PRs):**
- Role-selector pills and content-type toggles on register page — will fold into `ToggleGroup` in a later PR
- `select` elements in brand/agency settings, new-order category dropdown — waiting on shadcn `Select` primitive (PR #4b-2 or #4c)
- Search inputs on admin user list, browse creators — trivial follow-up, will batch into #4c

**Files added:** `src/components/ui/input.tsx`, `src/components/ui/label.tsx`, `src/components/ui/textarea.tsx`

**Files removed:** `src/components/ui/FormField.tsx`

**Files modified:** `src/app/[locale]/(auth)/login/page.tsx`, `src/app/[locale]/(auth)/register/page.tsx`, `src/components/tickets/NewTicketForm.tsx`, `package.json`, `package-lock.json`, `src/lib/constants.ts`, `PROGRESS.md`

---

**v3.3.0 → v3.4.0 — shadcn/ui Card + Select Primitives (PR #4c)**

**Context:** Third slice of the shadcn/ui migration. Adds the `Card` layout primitive and the `Select` primitive (Radix-backed combobox) and migrates the dashboard stat cards on every role's home page plus the new-order category dropdown for both brand and agency.

**1. New dependency:**
- `@radix-ui/react-select ^2.2.6` — backs the `Select` primitive (proper keyboard nav, portal-rendered popper, ARIA combobox semantics)

**2. New primitives (new-york style):**
- `src/components/ui/card.tsx` — exports `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter`. The base `Card` is a `flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm` div, matching the inline pattern used everywhere in the dashboards.
- `src/components/ui/select.tsx` — full new-york Select set: `Select`, `SelectGroup`, `SelectValue`, `SelectTrigger` (with `sm`/`default` size variants), `SelectContent` (popper position, portal-rendered), `SelectLabel`, `SelectItem` (with `CheckIcon` indicator), `SelectSeparator`, `SelectScrollUpButton`, `SelectScrollDownButton`. Brand colors wired in: `focus-visible:border-[#d4772c] focus-visible:ring-1 focus-visible:ring-[#d4772c]` on the trigger, `focus:bg-[#fdf6e3] focus:text-[#b85c1a]` on items.

**3. Migrated surfaces — stat cards (all four dashboards):**
- **`src/app/[locale]/(dashboard)/creator/page.tsx`** — 4 stat cards. Replaced inline `rounded-lg border border-gray-200 bg-white p-5 shadow-sm` with `<Card key={stat.label} className="gap-3">`. The `gap-3` override compresses the default `gap-4` to match the original visual rhythm (icon row + value).
- **`src/app/[locale]/(dashboard)/brand/page.tsx`** — 5 stat cards. Same migration, with `className="gap-3 p-6"` to preserve the brand dashboard's slightly larger card padding.
- **`src/app/[locale]/(dashboard)/network/page.tsx`** — 4 stat cards. Same migration. Removed the `mt-3` margin since `Card`'s flex column already supplies vertical rhythm.
- **`src/app/[locale]/(dashboard)/agency/page.tsx`** — 4 stat cards. Default `Card` (no override) since the agency layout already used the default `p-5` padding and the icon-beside-value layout doesn't need a custom gap.

**4. Migrated surfaces — Select dropdowns:**
- **`src/app/[locale]/(dashboard)/brand/orders/new/page.tsx`** — category `<select>` replaced with `<Select>` + `<SelectTrigger>` + `<SelectContent>` + `<SelectItem>`. Switched from `onChange={(e) => ...e.target.value}` to Radix's `onValueChange`.
- **`src/app/[locale]/(dashboard)/agency/orders/new/page.tsx`** — both the brand selector and the category selector migrated to `Select`. Two `<select>` → `<Select>` swaps in one file.

**5. Verification:**
- `npx tsc --noEmit` → clean
- `npm run lint` → 0 errors
- `npm test` → 21/21 passing
- `npx playwright test --list` → 8/8 still parsing (no smoke-test selectors target stat cards or category dropdowns)

**6. Version bump:** `3.3.0 → 3.4.0` in `package.json`, `package-lock.json`, `src/lib/constants.ts`. **+0.1.0 minor** — adds a new dep (`@radix-ui/react-select`) and 2 new primitives (`Card`, `Select`).

**7. Still hand-rolled (future PRs):**
- Other `<select>` instances: admin/users, admin/tickets, brand/browse, agency/browse — will batch into a follow-up since they're all filter dropdowns rather than form fields
- Custom `Toast.tsx` — pending PR #4d (`toast` + `alert` feedback primitives)
- Navbar user menu, language switcher — pending PR #4e (`dropdown-menu` + `popover`)
- Admin tables, custom `Pagination.tsx` — pending PR #4f (`table` + `pagination`)

**Files added:** `src/components/ui/card.tsx`, `src/components/ui/select.tsx`

**Files modified:** `src/app/[locale]/(dashboard)/creator/page.tsx`, `src/app/[locale]/(dashboard)/brand/page.tsx`, `src/app/[locale]/(dashboard)/network/page.tsx`, `src/app/[locale]/(dashboard)/agency/page.tsx`, `src/app/[locale]/(dashboard)/brand/orders/new/page.tsx`, `src/app/[locale]/(dashboard)/agency/orders/new/page.tsx`, `package.json`, `package-lock.json`, `src/lib/constants.ts`, `PROGRESS.md`

---

*Last updated: April 7, 2026 (v3.4.0)*
