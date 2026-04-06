# v3.0.0 — Production Infrastructure & Polish

## Features

### 1. Vercel Blob File Storage
- [ ] Install `@vercel/blob`
- [ ] Rewrite `/api/upload` to use `put()` from @vercel/blob
- [ ] Remove local `uploads/` directory dependency
- [ ] Update next.config.ts to allow blob.vercel-storage.com images

### 2. TikTok Auto-Refresh Cron
- [ ] Create `/api/cron/refresh-metrics` API route
- [ ] Batch refresh creators with stale metrics (>7 days)
- [ ] Add `CRON_SECRET` auth for cron endpoints
- [ ] Add vercel.json with cron schedule (daily at 3 AM UTC)

### 3. Order Expiration Cron
- [ ] Create `/api/cron/expire-orders` API route
- [ ] Auto-cancel OPEN orders past expiresAt
- [ ] Notify brands of expired orders
- [ ] Add to vercel.json cron schedule (daily at 4 AM UTC)

### 4. Analytics Charts
- [ ] Install `recharts`
- [ ] Add order status pie chart
- [ ] Add user role bar chart
- [ ] Add revenue trend (monthly) — extend API with time-series data
- [ ] Make analytics page a client component with chart wrappers

### 5. Mobile Optimization
- [ ] Dashboard layout: responsive padding (p-6 → p-3 sm:p-6)
- [ ] Tables: horizontal scroll + min-width on small screens
- [ ] Stat cards: stack properly on mobile
- [ ] Forms: full-width inputs on mobile

### 6. API Rate Limiting
- [ ] Create `src/lib/rate-limit.ts` with sliding window limiter
- [ ] Apply to auth routes (5 req/min)
- [ ] Apply to API routes (60 req/min)
- [ ] Return 429 with Retry-After header

### 7. Testing Infrastructure
- [ ] Install vitest + @testing-library/react + jsdom
- [ ] Create vitest.config.ts
- [ ] Write unit tests for scoring.ts
- [ ] Write unit tests for utils.ts
- [ ] Write API route tests for key endpoints

### 8. Finalize
- [ ] Bump version to 3.0.0
- [ ] Update PROGRESS.md (mark logo done, add all new features)
- [ ] Commit and push
