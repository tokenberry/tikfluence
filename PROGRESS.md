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
- [x] Navbar (dark charcoal theme, role-based nav links, mobile menu, user dropdown)
- [x] Sidebar (role-based links, active state highlighting)
- [x] Dashboard layout (sidebar + main content)

### API Routes (25 routes)
- [x] `POST /api/register` - User registration with role-specific profile creation
- [x] `GET /api/creators` - List creators with filters (category, tier, search, pagination)
- [x] `GET/PUT /api/creators/[id]` - Get/update creator profile
- [x] `POST /api/creators/[id]/score` - Recalculate creator score via TikTok API
- [x] `GET /api/categories` - List all categories (for dropdowns)
- [x] `GET /api/networks` - List networks (admin only)
- [x] `GET/POST /api/networks/[id]/creators` - List/add creators in network
- [x] `GET/POST /api/orders` - List orders (role-filtered), create order (brand only)
- [x] `GET/PUT/DELETE /api/orders/[id]` - Order CRUD
- [x] `POST /api/orders/[id]/accept` - Creator/network accepts order
- [x] `POST /api/orders/[id]/deliver` - Submit delivery with TikTok metrics, multiple links & screenshots
- [x] `POST /api/orders/[id]/approve` - Brand approves/rejects delivery
- [x] `POST /api/orders/[id]/deliveries/[deliveryId]/review` - Brand approve/reject individual delivery
- [x] `POST /api/orders/[id]/dispute` - Open dispute, creates support ticket
- [x] `POST /api/payments/connect` - Create Stripe Connect account + onboarding
- [x] `POST /api/payments/webhook` - Stripe webhook handler
- [x] `GET/POST /api/tickets` - List/create support tickets
- [x] `GET/PUT/POST /api/tickets/[id]` - Ticket detail, update, add message
- [x] `GET/PUT /api/admin/users` - User management (pagination, search, suspend)
- [x] `GET /api/admin/orders` - Admin order listing with filters
- [x] `GET /api/admin/analytics` - Platform analytics
- [x] `GET/PUT /api/admin/settings` - Platform settings (fee rate, budget limits)
- [x] `GET/PUT /api/brand/profile` - Brand settings profile management
- [x] `GET /api/network/creators/search` - Search unaffiliated creators by email/tiktok
- [x] `POST /api/network/creators` - Add creator to network
- [x] `POST /api/upload` - File upload (images, 10MB max)
- [x] `GET/PUT /api/notifications` - List user notifications, mark all read
- [x] `PUT /api/notifications/[id]` - Mark single notification read

### Dashboard Pages (20+ pages)
- [x] **Creator**: Profile, Orders, Order Detail (with delivery form), Earnings
- [x] **Network**: Creators list, Add creator, Orders, Order detail, Earnings
- [x] **Brand**: Browse creators, Orders list, New order form (with deadline), Order detail (with approve/reject, screenshots), Settings
- [x] **Admin**: Users management, Orders, Order detail (with admin actions), Transactions, Tickets, Settings, Analytics

### Core Libraries
- [x] `src/lib/prisma.ts` - Prisma client singleton
- [x] `src/lib/auth.ts` - NextAuth configuration
- [x] `src/lib/stripe.ts` - Stripe client + helpers
- [x] `src/lib/tiktok.ts` - TikTok API client
- [x] `src/lib/scoring.ts` - Creator scoring algorithm (engagement, followers, views, consistency)
- [x] `src/lib/utils.ts` - Shared utilities
- [x] `src/lib/notifications.ts` - In-app notification helper
- [x] `src/lib/email.ts` - Resend email notifications (6 templates)

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
- [ ] **Fox logo**: Replace placeholder SVG with actual Foxolog fox logo PNG
- [ ] **Stripe integration**: Configure Stripe keys in Vercel env vars, test payment flow
- [ ] **TikTok API**: Configure TikTok developer keys, test creator verification
- [x] **Google OAuth**: Google sign-in with PrismaAdapter, onboarding flow for new OAuth users (role selection + profile setup)
- [x] **Email notifications**: Resend integration with 6 email triggers (welcome, order accepted, delivery submitted, approved, rejected, dispute). From `notifications@foxolog.com`
- [x] **Database seeding**: Enhanced seed script with full demo data (3 brands, 5 creators across all tiers, 1 network, 7 orders at various statuses, deliveries, transactions, support ticket). Run with `npm run db:seed`

### Medium Priority
- [ ] **shadcn/ui components**: Architecture planned for reusable UI components (CreatorCard, OrderCard, etc.) - currently using inline Tailwind
- [ ] **File storage**: Currently saves to `/uploads` locally - needs S3/Vercel Blob for production
- [ ] **Error pages**: Custom 404, 500 error pages
- [ ] **Loading states**: Skeleton loaders for dashboard pages
- [ ] **Form validation**: Enhanced client-side validation with Zod on forms
- [ ] **Search & filters**: Full-text search on creator browse page
- [ ] **Pagination**: Proper pagination UI on list pages

### Low Priority / Future
- [ ] **Creator settings page**: Missing from creator dashboard (in architecture but not built)
- [ ] **Network settings page**: Missing from network dashboard
- [ ] **TikTok auto-refresh**: Cron job to refresh creator metrics every 7 days
- [ ] **Order expiration**: Auto-expire orders past deadline (deadlines now stored and displayed, but no auto-expiry cron yet)
- [ ] **Analytics charts**: Visual charts on admin analytics page
- [ ] **Dark mode**: Theme toggle
- [ ] **Mobile optimization**: Responsive improvements on dashboard pages
- [ ] **Rate limiting**: API rate limiting for production
- [ ] **Testing**: Unit tests, integration tests

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
| `TIKTOK_CLIENT_KEY` | Not set |
| `TIKTOK_CLIENT_SECRET` | Not set |
| `ANTHROPIC_API_KEY` | Not set |

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

**Dependencies added:** `@anthropic-ai/sdk`

**Environment variables needed:**
- `ANTHROPIC_API_KEY` — Required for AI creator analysis feature

**Infrastructure needed after merge:**
- Run `prisma db push` to apply schema changes (auto-runs on Vercel build)
- Set `ANTHROPIC_API_KEY` in Vercel environment variables

**Planned for v0.5.0:** Post-delivery AI analysis + "What's Next" suggestions
**Planned for v0.6.0:** Separate Agency dashboard with managed campaigns

---

*Last updated: March 29, 2026*
