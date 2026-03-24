# Tikfluence - TikTok Influencer Marketplace

## Context
Build a full-stack marketplace web app that connects TikTok creators/creator networks with brands. The platform acts as an automated influencer agency with escrow payments via Stripe Connect. Brands post orders with impression targets and budgets; creators accept and deliver TikTok content; the platform holds funds in escrow and releases on delivery approval.

## Hosting
- DigitalOcean Droplet for production deployment

## Tech Stack
- **Framework**: Next.js 14+ (App Router) with TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **UI**: Tailwind CSS + shadcn/ui
- **Auth**: NextAuth.js (credentials + Google OAuth)
- **Payments**: Stripe Connect (marketplace escrow)
- **TikTok**: TikTok API for creator verification & scoring
- **File Storage**: Local uploads initially (S3-ready pattern)
- **Email**: Resend (transactional emails)

---

## Project Structure

```
tikfluence/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── creator/
│   │   │   │   ├── profile/page.tsx
│   │   │   │   ├── orders/page.tsx
│   │   │   │   ├── orders/[id]/page.tsx
│   │   │   │   ├── earnings/page.tsx
│   │   │   │   └── settings/page.tsx
│   │   │   ├── network/
│   │   │   │   ├── creators/page.tsx
│   │   │   │   ├── creators/add/page.tsx
│   │   │   │   ├── orders/page.tsx
│   │   │   │   ├── orders/[id]/page.tsx
│   │   │   │   ├── earnings/page.tsx
│   │   │   │   └── settings/page.tsx
│   │   │   ├── brand/
│   │   │   │   ├── browse/page.tsx
│   │   │   │   ├── orders/page.tsx
│   │   │   │   ├── orders/new/page.tsx
│   │   │   │   ├── orders/[id]/page.tsx
│   │   │   │   └── settings/page.tsx
│   │   │   ├── admin/
│   │   │   │   ├── users/page.tsx
│   │   │   │   ├── orders/page.tsx
│   │   │   │   ├── transactions/page.tsx
│   │   │   │   ├── tickets/page.tsx
│   │   │   │   ├── settings/page.tsx
│   │   │   │   └── analytics/page.tsx
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── creators/route.ts
│   │   │   ├── creators/[id]/route.ts
│   │   │   ├── creators/[id]/score/route.ts
│   │   │   ├── networks/route.ts
│   │   │   ├── networks/[id]/creators/route.ts
│   │   │   ├── brands/route.ts
│   │   │   ├── orders/route.ts
│   │   │   ├── orders/[id]/route.ts
│   │   │   ├── orders/[id]/accept/route.ts
│   │   │   ├── orders/[id]/deliver/route.ts
│   │   │   ├── orders/[id]/approve/route.ts
│   │   │   ├── orders/[id]/dispute/route.ts
│   │   │   ├── payments/route.ts
│   │   │   ├── payments/webhook/route.ts
│   │   │   ├── payments/connect/route.ts
│   │   │   ├── tiktok/verify/route.ts
│   │   │   ├── tiktok/refresh/route.ts
│   │   │   ├── tickets/route.ts
│   │   │   ├── tickets/[id]/route.ts
│   │   │   ├── admin/[...path]/route.ts
│   │   │   └── upload/route.ts
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Landing page
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   ├── creators/
│   │   │   ├── CreatorCard.tsx
│   │   │   ├── CreatorGrid.tsx
│   │   │   ├── ScoreBadge.tsx
│   │   │   └── TikTokConnect.tsx
│   │   ├── orders/
│   │   │   ├── OrderCard.tsx
│   │   │   ├── OrderForm.tsx
│   │   │   ├── DeliveryForm.tsx
│   │   │   └── OrderTimeline.tsx
│   │   └── payments/
│   │       ├── StripeCheckout.tsx
│   │       └── ConnectOnboard.tsx
│   ├── lib/
│   │   ├── prisma.ts             # Prisma client singleton
│   │   ├── auth.ts               # NextAuth config
│   │   ├── stripe.ts             # Stripe client + helpers
│   │   ├── tiktok.ts             # TikTok API client + scoring
│   │   ├── scoring.ts            # Creator scoring algorithm
│   │   └── utils.ts              # Shared utilities
│   ├── types/
│   │   └── index.ts              # Shared TypeScript types
│   └── middleware.ts             # Auth + role-based route protection
├── public/
├── .env.example
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.ts
```

---

## User Roles

### 1. Creator (Individual TikTok Creators)
- Sign up and link TikTok profile
- Get automatically scored based on TikTok metrics
- Browse and accept brand orders
- Submit deliveries (TikTok link + analytics screenshot)
- Receive payouts via Stripe Connect

### 2. Creator Network (Agencies)
- Register company and manage a roster of creators
- Accept orders on behalf of their creators
- Manage deliveries across their network
- Receive payouts distributed to their Stripe account

### 3. Brand (Companies)
- Create orders with impression targets and budgets
- Browse creators by vertical, score, and price tier
- Review deliveries and approve/request revisions
- Pay via Stripe (funds held in escrow)

### 4. Admin (Platform Operators)
- Oversee all transactions and users
- Handle support tickets and disputes
- Configure platform fees
- View analytics dashboard

---

## Database Schema (Prisma)

### Core Models

```prisma
enum UserRole {
  CREATOR
  NETWORK
  BRAND
  ADMIN
}

enum OrderStatus {
  DRAFT
  OPEN           // Published, accepting creators
  ASSIGNED       // Creator accepted
  IN_PROGRESS    // Creator working on it
  DELIVERED      // Creator submitted delivery
  REVISION       // Brand requested changes
  APPROVED       // Brand approved, payment releasing
  COMPLETED      // Payment released
  DISPUTED       // Under dispute
  CANCELLED
}

enum PaymentStatus {
  PENDING
  HELD           // In escrow
  RELEASED       // Paid to creator
  REFUNDED
  FAILED
}

enum TicketStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
  CLOSED
}

model User {
  id              String    @id @default(cuid())
  email           String    @unique
  password        String    // hashed
  name            String
  role            UserRole
  avatar          String?
  emailVerified   DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  creator         Creator?
  network         CreatorNetwork?
  brand           Brand?
  tickets         SupportTicket[]     @relation("TicketCreator")
  assignedTickets SupportTicket[]     @relation("TicketAssignee")
}

model Creator {
  id                String    @id @default(cuid())
  userId            String    @unique
  user              User      @relation(fields: [userId], references: [id])

  // TikTok profile
  tiktokUsername    String    @unique
  tiktokId          String?   @unique
  tiktokVerified    Boolean   @default(false)

  // Metrics (from TikTok API)
  followerCount     Int       @default(0)
  avgViews          Int       @default(0)
  engagementRate    Float     @default(0)
  totalLikes        Int       @default(0)
  totalVideos       Int       @default(0)

  // Scoring
  score             Float     @default(0)    // 0-100
  tier              Int       @default(1)    // 1-5 (determines price level)
  pricePerThousand  Float     @default(0)    // $ per 1000 impressions

  // Profile
  bio               String?
  categories        CreatorCategory[]
  portfolioLinks    String[]   @default([])

  // Stripe
  stripeAccountId   String?
  stripeOnboarded   Boolean   @default(false)

  // Network relation (optional)
  networkId         String?
  network           CreatorNetwork?  @relation(fields: [networkId], references: [id])

  // Metrics history
  metricsUpdatedAt  DateTime?
  orderAssignments  OrderAssignment[]
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}

model CreatorNetwork {
  id              String    @id @default(cuid())
  userId          String    @unique
  user            User      @relation(fields: [userId], references: [id])

  companyName     String
  website         String?
  description     String?

  // Stripe
  stripeAccountId String?
  stripeOnboarded Boolean   @default(false)

  creators        Creator[]
  orderAssignments OrderAssignment[]
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model Brand {
  id              String    @id @default(cuid())
  userId          String    @unique
  user            User      @relation(fields: [userId], references: [id])

  companyName     String
  website         String?
  industry        String?
  description     String?
  logo            String?

  orders          Order[]
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model Category {
  id        String    @id @default(cuid())
  name      String    @unique   // Music, Sports, Fashion, etc.
  slug      String    @unique
  icon      String?
  creators  CreatorCategory[]
  orders    Order[]
}

model CreatorCategory {
  creatorId  String
  categoryId String
  creator    Creator   @relation(fields: [creatorId], references: [id])
  category   Category  @relation(fields: [categoryId], references: [id])

  @@id([creatorId, categoryId])
}

model Order {
  id                String       @id @default(cuid())
  brandId           String
  brand             Brand        @relation(fields: [brandId], references: [id])

  title             String
  description       String
  brief             String?       // Detailed content brief
  categoryId        String
  category          Category     @relation(fields: [categoryId], references: [id])

  // Targets
  impressionTarget  Int           // e.g., 1000
  budget            Float         // e.g., 10.00 ($)
  cpmRate           Float         // Cost per 1000 impressions

  status            OrderStatus  @default(DRAFT)
  maxCreators       Int          @default(1)

  // Stripe
  stripePaymentId   String?       // PaymentIntent ID
  paymentStatus     PaymentStatus @default(PENDING)

  assignments       OrderAssignment[]
  deliveries        Delivery[]
  transactions      Transaction[]
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt
  expiresAt         DateTime?
}

model OrderAssignment {
  id          String    @id @default(cuid())
  orderId     String
  order       Order     @relation(fields: [orderId], references: [id])

  creatorId   String?
  creator     Creator?  @relation(fields: [creatorId], references: [id])
  networkId   String?
  network     CreatorNetwork? @relation(fields: [networkId], references: [id])

  status      OrderStatus @default(ASSIGNED)
  acceptedAt  DateTime  @default(now())
  completedAt DateTime?
}

model Delivery {
  id              String    @id @default(cuid())
  orderId         String
  order           Order     @relation(fields: [orderId], references: [id])

  tiktokLink      String
  screenshotUrl   String?
  impressions     Int?
  views           Int?
  likes           Int?
  comments        Int?
  shares          Int?
  notes           String?

  submittedAt     DateTime  @default(now())
  reviewedAt      DateTime?
  approved        Boolean?
  rejectionReason String?
}

model Transaction {
  id              String    @id @default(cuid())
  orderId         String
  order           Order     @relation(fields: [orderId], references: [id])

  amount          Float
  platformFee     Float
  creatorPayout   Float
  currency        String     @default("usd")

  stripePaymentId String?
  stripeTransferId String?
  status          PaymentStatus @default(PENDING)

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model SupportTicket {
  id          String       @id @default(cuid())
  creatorId   String
  creator     User         @relation("TicketCreator", fields: [creatorId], references: [id])

  assigneeId  String?
  assignee    User?        @relation("TicketAssignee", fields: [assigneeId], references: [id])

  subject     String
  description String
  status      TicketStatus @default(OPEN)
  priority    Int          @default(0)

  messages    TicketMessage[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model TicketMessage {
  id        String    @id @default(cuid())
  ticketId  String
  ticket    SupportTicket @relation(fields: [ticketId], references: [id])
  senderId  String
  message   String
  createdAt DateTime  @default(now())
}

model PlatformSettings {
  id              String  @id @default("default")
  platformFeeRate Float   @default(0.15)   // 15%
  minOrderBudget  Float   @default(5.00)
  maxOrderBudget  Float   @default(100000)
}
```

---

## TikTok API Integration & Creator Scoring

### TikTok Data Fetching (`src/lib/tiktok.ts`)
- Use TikTok's **Content Discovery API** or **Research API** to fetch creator data
- Endpoints needed: user info, user videos, video metrics
- Fallback: if API access is pending, use TikTok profile URL scraping via a third-party service as backup
- Store refresh token, auto-refresh metrics every 7 days via cron job

### Scoring Algorithm (`src/lib/scoring.ts`)
```
Creator Score (0-100) = weighted sum of:
  - Engagement Rate (30%):  (likes + comments + shares) / views × 100
  - Follower Count  (20%):  log10(followers) normalized to 0-100
  - Avg Views       (25%):  log10(avgViews) normalized to 0-100
  - Content Consistency (15%): posting frequency score (videos/week)
  - Profile Completeness (10%): bio, categories, portfolio filled

Tier mapping:
  - Tier 1 (Score 0-20):   $2  per 1000 impressions
  - Tier 2 (Score 21-40):  $5  per 1000 impressions
  - Tier 3 (Score 41-60):  $10 per 1000 impressions
  - Tier 4 (Score 61-80):  $20 per 1000 impressions
  - Tier 5 (Score 81-100): $40 per 1000 impressions
```

---

## Stripe Connect Escrow Flow

### Setup
1. Platform creates a Stripe Connect account (platform account)
2. Creators/Networks onboard via Stripe Connect Express (hosted onboarding)

### Payment Flow
1. **Brand creates order** → Stripe PaymentIntent created with `transfer_group`
2. **Brand pays** → Funds captured and held on platform's Stripe account (escrow)
3. **Creator delivers + Brand approves** → Platform initiates `Transfer` to creator's connected account minus platform fee
4. **Dispute** → Admin reviews, can refund brand or release to creator

### Key Stripe Objects
- `PaymentIntent` — brand payment into escrow
- `Transfer` — platform → creator payout
- `Account` (Connect Express) — creator/network Stripe account
- Webhook events: `payment_intent.succeeded`, `transfer.created`, `account.updated`

---

## Authentication & Middleware

### NextAuth Config (`src/lib/auth.ts`)
- Credentials provider (email + password)
- Google OAuth provider (optional)
- JWT strategy with role in token
- Session includes: userId, role, email, name

### Middleware (`src/middleware.ts`)
Route protection by role:
- `/creator/*` → CREATOR role only
- `/network/*` → NETWORK role only
- `/brand/*` → BRAND role only
- `/admin/*` → ADMIN role only
- `/api/*` → authenticated (with role checks in handlers)

---

## Order Lifecycle

```
DRAFT → OPEN → ASSIGNED → IN_PROGRESS → DELIVERED → APPROVED → COMPLETED
                                            ↓
                                         REVISION → DELIVERED (resubmit)
                                            ↓
                                         DISPUTED (admin intervenes)

At any point: → CANCELLED
```

---

## Categories / Verticals
Music, Sports, Fashion, Gaming, Food, Tech, Lifestyle, Comedy, Education, Beauty, Travel, Fitness, Pets, DIY, Business
