# Active Backlog

Source of truth: `PROGRESS.md`. This file tracks only the *actionable* pending items for the current session window.

## Open — Session 2026-04-11: 4 New Features

This session plans 4 major features that extend the order lifecycle and creator discovery. All four are layered on top of the existing state machine; none require breaking schema migrations.

---

### Feature 1 — Order Chat (Creator ↔ Order Placer)

**Goal:** Once an order is accepted, the assigned creator and the person who placed the order (brand, or agency/account-manager acting on behalf of the brand) can exchange messages inline on the order page. Support image attachments so a creator can quickly ask a clarifying question with a screenshot.

**Data model (new):**
- `OrderMessage` — `{ id, orderId, assignmentId, senderUserId, body, attachments String[], createdAt }`
  - `assignmentId` scopes the thread to one (order, creator) pair so multi-creator orders get per-creator private threads. Brand side sees all threads; creator side sees only their own.
- `OrderMessageRead` — `{ id, userId, assignmentId, lastReadAt, updatedAt }` (composite unique on `userId + assignmentId`). Used for unread counts without per-message read rows.

**State machine impact:** None. Chat is available once `OrderAssignment` exists (i.e. from ASSIGNED through COMPLETED/DISPUTED/CANCELLED). Read-only after COMPLETED? **Decision: keep writable forever** — creators and brands may need to discuss post-completion.

**Authorization rules:**
- Assigned creator (via `OrderAssignment.creatorId`) or network (`OrderAssignment.networkId`) can read/write their own assignment thread
- `Order.brand.user` can read/write every thread on their order
- `Order.agencyId`'s user can read/write every thread (if set)
- `AccountManagerBrand` holders for the brand can read/write
- Admin can read/write (support intervention)
- No one else — enforced via a new `canAccessOrderThread()` guard in `src/lib/guards.ts`

**API routes:**
- `GET /api/orders/[id]/messages?assignmentId=...` — paginated (cursor on `createdAt DESC`), returns `{ messages, hasMore }`
- `POST /api/orders/[id]/messages` — body `{ assignmentId, body, attachments? }`, Zod-validated (body ≤ 2000 chars, ≤ 5 attachments)
- `POST /api/orders/[id]/messages/read` — body `{ assignmentId }`, upserts `OrderMessageRead.lastReadAt = now`

**UI:**
- Shared `<OrderChatPanel>` component mounted on creator + brand + agency + AM + admin order-detail pages
- Chat UI: scrollable message list, sticky composer, file attachment button (reuses existing `/api/upload` for images)
- 15s polling (same pattern as `NotificationBell`); pauses when tab hidden; no SSE/websockets (matches the rest of the app)
- For multi-creator orders on the placer side: `<OrderChatThreadSelector>` switches between per-assignment threads

**Notifications:**
- New type `order_message_received` → recipient is every *other* participant on the same thread
- Notification bell picks it up via existing polling (no change to bell)
- Email: **not** on first pass (too noisy; reuse-later)

**Version bump:** 3.15.0 → **3.16.0** (minor, +0.1 — new model, new routes, new UI component)

**PR title:** `feat(chat): order messaging between creator and order placer (v3.16.0)`

---

### Feature 2 — Pre-Publish Content Review (Draft Approval)

**Goal:** Creator uploads draft video/images for brand approval **before** posting on TikTok. Brand approves or requests changes. Creator iterates until approved, then publishes and submits the normal delivery.

**Data model (new):**
- `ContentDraft` — `{ id, orderId, assignmentId, version Int, files String[] (URLs), notes String?, status DraftStatus, rejectionReason String?, reviewedAt?, reviewedByUserId?, submittedAt, createdAt, updatedAt }`
- `DraftStatus` enum — `PENDING_REVIEW | APPROVED | CHANGES_REQUESTED | WITHDRAWN`
- `version` auto-increments per assignment (v1, v2, v3 as the creator iterates)

**State machine impact:** **None — drafts are additive, not gating.**
- Creator can submit a draft any time between ASSIGNED and DELIVERED
- Brand approval of a draft is **advisory** at the data level; final DELIVERED+approve still controls payout
- In the UI, the `DeliveryForm` surfaces a warning "Your latest draft has not been approved yet — are you sure you want to post?" but does not hard-block
- Brands who want to enforce pre-approval can set `Brand.requiresContentReview: Boolean` (new field, default false) — when true, `POST /api/orders/[id]/deliver` rejects with 400 unless `ContentDraft.status === APPROVED` for that assignment

**Upload path:** Videos need to expand `/api/upload`:
- New query param `?kind=video` (defaults to `image` for backwards compat)
- Video max size: **200 MB** (Vercel Blob supports up to 4.5 GB on pro but we cap to keep Next 16 route body limits predictable)
- Video MIME types: `video/mp4`, `video/quicktime`, `video/webm`
- Magic-byte validation for each: MP4/MOV (`ftyp` box at offset 4), WebM (`1A 45 DF A3`)
- Reuse existing rate limiter bucket (`RATE_LIMITS.upload`)

**API routes:**
- `POST /api/orders/[id]/drafts` — body `{ assignmentId, files, notes }`, creator-only
- `GET /api/orders/[id]/drafts` — lists all drafts for the order (creator sees their own assignment's drafts; brand/agency/AM/admin sees all)
- `POST /api/orders/[id]/drafts/[draftId]/review` — body `{ approved, rejectionReason? }`, brand/agency/AM/admin only
- `DELETE /api/orders/[id]/drafts/[draftId]` — creator withdraws unreviewed draft (sets status WITHDRAWN)

**UI:**
- New `<DraftSubmissionForm>` on creator order-detail page (drag-drop like `DeliveryForm`, accepts videos + images)
- New `<DraftReviewPanel>` on brand/agency/AM order-detail pages — shows each draft version, side-by-side with an approve/request-changes form
- Creator's `DeliveryForm` checks latest draft and shows a contextual warning if unapproved
- Brand settings page gets a `requiresContentReview` toggle

**Notifications & email:**
- `content_draft_submitted` → brand (+ agency if present), + `sendContentDraftSubmittedEmail`
- `content_draft_approved` → creator, + `sendContentDraftApprovedEmail`
- `content_draft_rejected` → creator, + `sendContentDraftRejectedEmail` (includes rejection reason)

**Version bump:** 3.16.0 → **3.17.0** (minor, +0.1)

**PR title:** `feat(drafts): pre-publish content review flow (v3.17.0)`

---

### Feature 3 — Physical Product Shipping

**Goal:** When a brand needs to send a physical product (sample, PR gift, merch) to a creator, track the shipment end-to-end inside the order. Creator's address is private until an order pairs them with a brand.

**Data model (new fields + 1 new model):**
- `Creator` gets nullable shipping address fields: `shippingName`, `shippingLine1`, `shippingLine2`, `shippingCity`, `shippingState`, `shippingPostalCode`, `shippingCountry`, `shippingPhone`. All optional; creator opts in by filling them on their settings page.
- `Order` gets `requiresShipping Boolean @default(false)` + `productDescription String?`. Brand checks this when creating the order.
- New model `Shipment` — `{ id, orderId, assignmentId, carrier String?, trackingNumber String?, trackingUrl String?, shippingAddressSnapshot String (JSON snapshot at time of creation), status ShipmentStatus, shippedAt?, deliveredAt?, receivedAt?, notes String?, createdAt, updatedAt }`
- `ShipmentStatus` enum — `PENDING | SHIPPED | IN_TRANSIT | DELIVERED | RECEIVED | ISSUE`
  - `SHIPPED` = brand marks shipped + tracking info
  - `DELIVERED` = brand marks carrier-delivered (optional; can be skipped)
  - `RECEIVED` = creator explicitly confirms they got it (only creator can set this)
  - `ISSUE` = either party flags a problem (opens context for admin)

**Creator address privacy:**
- `GET /api/orders/[id]/shipping-address` — returns the creator's current address ONLY if: the caller is the brand (or agency/AM of the brand), AND an `OrderAssignment` exists linking this order to the creator, AND `Order.requiresShipping === true`
- The address is **snapshotted** into `Shipment.shippingAddressSnapshot` on shipment creation so the creator can later update their address without affecting in-flight shipments

**State machine impact:**
- Soft: if `Order.requiresShipping === true` and no `Shipment.status IN (RECEIVED)` exists for the assignment, creator's `DeliveryForm` shows a warning
- Hard: if `Brand.requiresContentReview === true` (Feature 2) OR the new `Brand.blockDeliveryUntilShipmentReceived === true`, the deliver endpoint rejects submissions until the shipment is marked `RECEIVED`. Defaults to false for compatibility with existing orders.
- Zero impact on Order.status enum itself

**API routes:**
- `GET/PUT /api/creators/me/shipping` — creator manages their saved address
- `GET /api/orders/[id]/shipments` — lists shipments for order (auth: brand side + assigned creator)
- `POST /api/orders/[id]/shipments` — brand creates shipment entry (snapshots the creator's address)
- `PUT /api/orders/[id]/shipments/[shipmentId]` — brand updates tracking/status, OR creator sets `status=RECEIVED`
- `GET /api/orders/[id]/shipping-address` — brand-side address viewer (privacy-gated)

**UI:**
- Creator settings page gets a "Shipping address (private)" section
- Brand's new-order form gets a `requiresShipping` checkbox + product description field
- Brand order-detail: `<ShipmentPanel>` with "Mark shipped" button (carrier + tracking number form)
- Creator order-detail: `<ShipmentCard>` showing tracking info + "Confirm receipt" button. Auto-generates tracking URL for major carriers (USPS/UPS/FedEx/DHL) from carrier name + number if `trackingUrl` is null
- Brand order-creation form warns "This order requires shipping — the creator will provide their address after accepting"

**Carrier integration:** None in v1. Brand enters carrier name + tracking number as free text; UI template-builds the tracking URL for common carriers client-side. v2 could wire Shippo or EasyPost.

**Notifications & email:**
- `shipment_created` → creator
- `shipment_shipped` → creator (+ email)
- `shipment_received_by_creator` → brand (+ email)

**Version bump:** 3.17.0 → **3.18.0** (minor, +0.1)

**PR title:** `feat(shipping): physical product shipment tracking (v3.18.0)`

---

### Feature 4 — AI Campaign-Driven Creator Matching ⭐ (flagship)

**Goal:** Replace generic filter-based creator browse with a brief-driven matching engine. Brand/agency writes a campaign description in natural language; AI returns a ranked short-list of the best-fit creators with per-creator reasoning ("why this creator for this campaign"). This is the "cutting edge" differentiator.

**Data model (new):**
- `CampaignBrief` — `{ id, authorUserId, brandId, agencyId?, title, goals, targetAudience, tone?, budget Float, contentTypes String[] (array of 'SHORT_VIDEO','LIVE','COMBO'), categoryHints String[] (slugs), additionalNotes?, createdAt, updatedAt }`
- `CampaignMatch` — `{ id, campaignBriefId, creatorId, score Float, rank Int, reasoning String, strengths String[], concerns String[], recommendedBudget Float?, generatedAt, generatedByModel String }`. Indexes on `(campaignBriefId, rank)` and `creatorId`.

**AI matching pipeline:**
1. **Pre-filter** (fast, deterministic, done in Postgres):
   - Creator must support at least one content type in `brief.contentTypes`
   - `pricePerThousand` must be within `[brief.budget * 0.2, brief.budget * 2]` or close (heuristic; tuned during implementation)
   - `score >= 30` (baseline quality floor)
   - If `categoryHints` non-empty, boost creators matching at least one category
   - Order by `score DESC`, take top **50**
2. **LLM ranking** (one OpenAI call using existing `src/lib/ai.ts` infrastructure):
   - Model: `gpt-4o-mini` (same as existing)
   - System prompt: "You are an expert creator-matching analyst for influencer marketing campaigns. Given a campaign brief and 50 candidate creators, return the 10 best fits ranked by suitability. Base your ranking on audience match, content style alignment, category fit, tier vs. budget fit, and engagement quality. Be specific in reasoning."
   - User message: JSON with `{ brief, candidates: [{creatorId, tiktokUsername, tier, followerCount, avgViews, engagementRate, score, pricePerThousand, categories, bio, supportsLive, supportsShortVideo, latestAiAnalysis?}] }`
   - Response: JSON `{ matches: [{ creatorId, rank (1-10), score (0-100), reasoning, strengths[], concerns[], recommendedBudget }] }`
   - Zod schema validation + 60s timeout (reuses existing `AI_TIMEOUT_MS`)
3. **Persist** — bulk-insert `CampaignMatch` rows (delete previous matches for same brief first; "refresh" is idempotent)
4. **Fallback** — if OpenAI fails, still return the 10 top-by-score candidates with reasoning set to "Algorithmic match based on creator score and content type fit" so the user never sees an empty page

**Cost & latency guardrails:**
- Candidate list capped at 50 (keeps context ≤ ~8K tokens total)
- Compact creator summaries (drop long bios beyond 300 chars, latest AI analysis summary only)
- Cached — users can re-run the match with a "Refresh" button, but re-running the same brief within 5 minutes returns cached results (new `CampaignMatch.generatedAt` check)

**API routes:**
- `POST /api/campaigns` — create brief, Zod-validated (title 3-100, goals 20-2000, audience 20-1000, budget > 0)
- `GET /api/campaigns` — list caller's briefs (brand sees own, agency sees own, admin sees all)
- `GET /api/campaigns/[id]` — fetch brief + matches
- `PUT /api/campaigns/[id]` — update brief (invalidates matches)
- `DELETE /api/campaigns/[id]`
- `POST /api/campaigns/[id]/match` — run AI matching (returns matches, idempotent with 5-min cache)

**UI:**
- New sidebar entry: "Smart Match" with `Sparkles` Lucide icon (under Brand + Agency nav)
- New pages under `/brand/campaigns` and `/agency/campaigns`:
  - `/campaigns` — list of briefs
  - `/campaigns/new` — guided 4-step form:
    1. **Campaign basics** — title, goals ("What are you trying to achieve?")
    2. **Audience** — target audience description
    3. **Budget & format** — total budget, which content types, tone picker (professional/casual/edgy/playful/premium)
    4. **Preferences** — optional category hints, any "must-have" notes
  - `/campaigns/[id]` — brief detail page showing:
    - Campaign summary header
    - Big "Find matching creators" / "Refresh matches" button
    - Ranked match cards with per-creator AI reasoning (reusing `<CreatorCard>` + an expandable reasoning panel below each card)
    - Each card CTA: "View profile" (goes to `/brand/browse/[id]`) or "Create order with this creator" (pre-fills new-order form)

**Notifications:** None for first pass — this is synchronous and user-driven.

**Version bump:** 3.18.0 → **4.0.0** (major milestone — flagship new surface area, warrants the 4.x rollover)

**PR title:** `feat(ai): campaign brief → AI creator matching (v4.0.0)`

---

## Implementation Approach — Questions for You

Before I start writing code, 3 decisions I need from you:

1. **Order & scope**
   - Ship all 4 as separate PRs in order 1 → 2 → 3 → 4? (safest, slowest)
   - Or pick a priority order / drop one to tighten scope?

2. **Branching strategy**
   - Harness assigned branch `claude/review-progress-versioning-xsMBo` for this session. Your operational rules say "clean branch per issue." These conflict.
   - Options: (a) one branch + one PR with all 4 features (large diff), (b) the assigned branch holds Feature 1 + I cut new branches for Features 2-4 as separate PRs, (c) I cut 4 fresh branches from main and abandon the assigned one
   - My recommendation: **(b)** — use the assigned branch for the first feature, create fresh branches for 2-4. But this needs your go-ahead since the harness instructions said not to push to different branches without permission.

3. **Scope cuts I'd recommend (to fit realistic scope)**
   - Feature 1: skip read-state tracking in v1 (no `OrderMessageRead` model); show all messages, defer unread counts to a follow-up. Saves ~30% of the work. ❓
   - Feature 2: skip `Brand.requiresContentReview` gate; drafts are purely advisory in v1. Saves ~15%. ❓
   - Feature 3: skip auto-generating carrier tracking URLs; require brand to paste full URL. Saves ~10%. ❓
   - Feature 4: ship with 4-step brief form as **a single form**, not a stepper. Saves ~15%. ❓

---

## Recently Shipped

- **v3.15.0** (PR #90) — `CreatorCard` + `OrderCard` extraction across 5 list pages
- **v3.14.1** (PR #89) — `VerificationBanner` Alert migration + PROGRESS.md accuracy sweep
- **v3.14.0** (PR #88) — Admin audit log + bulk user ops + dispute polish
- **v3.13.0** (PR #87) — Observability (structured logger + request-ID middleware + Sentry env-gated)
