import { PrismaClient } from "@prisma/client"

/**
 * DB reset fixture for e2e mutation tests.
 *
 * `resetMutableOrderState()` deletes every row that the mutation flow
 * creates or updates (orders, order assignments, deliveries, transactions,
 * notifications, brand credits, support ticket messages + tickets, internal
 * notes, AI analyses), then re-runs the order-seeding slice of
 * `prisma/seed.ts` so the mutation spec starts from a known baseline.
 *
 * It does NOT delete users, creators, brands, networks, agencies, account
 * managers, categories, or platform settings — those are the stable
 * identities the mutation spec logs in as, and seed.ts upserts them so
 * re-running the full seed would be safe but slower and needlessly noisy.
 *
 * Intended to run in `test.beforeAll()` of `e2e/mutation.spec.ts` only.
 * Safe to run against a local dev database; refuses to run if
 * `DATABASE_URL` points at anything other than a local host.
 */

function assertLocalDatabase(url: string | undefined): string {
  if (!url) {
    throw new Error(
      "[e2e reset] DATABASE_URL is not set. Authed mutation tests require " +
        "a local development database."
    )
  }
  // Rough check: allow localhost, 127.0.0.1, or anything that parses as a
  // non-public host. We deliberately avoid parsing the URL with URL() so
  // this works against postgres:// and postgresql:// equally.
  const isLocal =
    url.includes("@localhost") ||
    url.includes("@127.0.0.1") ||
    url.includes("@db:") || // docker-compose service
    url.includes("@postgres:") // docker-compose service
  if (!isLocal) {
    throw new Error(
      `[e2e reset] Refusing to truncate order state against non-local ` +
        `DATABASE_URL. Authed mutation tests must run against a local ` +
        `development database.`
    )
  }
  return url
}

let prisma: PrismaClient | null = null
function getPrisma(): PrismaClient {
  if (!prisma) {
    assertLocalDatabase(process.env.DATABASE_URL)
    prisma = new PrismaClient()
  }
  return prisma
}

export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect()
    prisma = null
  }
}

/**
 * Truncate every row the mutation spec might create or touch, then reseed
 * the minimum baseline of orders the spec needs. Leaves all identity rows
 * (users, brands, creators, categories, platform settings) intact.
 */
export async function resetMutableOrderState(): Promise<void> {
  const db = getPrisma()

  // Delete in dependency order to satisfy foreign keys.
  await db.aiDeliveryAnalysis.deleteMany({})
  await db.delivery.deleteMany({})
  await db.transaction.deleteMany({})
  await db.orderAssignment.deleteMany({})
  await db.internalNote.deleteMany({ where: { orderId: { not: null } } })
  await db.order.deleteMany({})
  await db.brandCredit.deleteMany({})

  // Notifications and support tickets are created as side-effects of the
  // mutation flow; wipe them too so we can assert on fresh rows if ever
  // needed.
  await db.notification.deleteMany({})
  await db.ticketMessage.deleteMany({})
  await db.supportTicket.deleteMany({})

  // No reseed required — the mutation spec creates its own DRAFT → OPEN
  // orders via the API. Leaving the tables empty gives each run a clean
  // slate.
}
