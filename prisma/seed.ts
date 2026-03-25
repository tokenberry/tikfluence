import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

const categories = [
  { name: "Music", slug: "music", icon: "music" },
  { name: "Sports", slug: "sports", icon: "trophy" },
  { name: "Fashion", slug: "fashion", icon: "shirt" },
  { name: "Gaming", slug: "gaming", icon: "gamepad-2" },
  { name: "Food", slug: "food", icon: "utensils" },
  { name: "Tech", slug: "tech", icon: "laptop" },
  { name: "Lifestyle", slug: "lifestyle", icon: "heart" },
  { name: "Comedy", slug: "comedy", icon: "laugh" },
  { name: "Education", slug: "education", icon: "graduation-cap" },
  { name: "Beauty", slug: "beauty", icon: "sparkles" },
  { name: "Travel", slug: "travel", icon: "plane" },
  { name: "Fitness", slug: "fitness", icon: "dumbbell" },
  { name: "Pets", slug: "pets", icon: "paw-print" },
  { name: "DIY", slug: "diy", icon: "wrench" },
  { name: "Business", slug: "business", icon: "briefcase" },
]

async function main() {
  console.log("Seeding database...")

  const hashedPassword = await bcrypt.hash("demo123", 12)

  // ── Categories ──────────────────────────────────────────────
  const categoryRecords: Record<string, string> = {}
  for (const category of categories) {
    const record = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    })
    categoryRecords[category.slug] = record.id
  }
  console.log(`Created ${categories.length} categories`)

  // ── Platform Settings ───────────────────────────────────────
  await prisma.platformSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      platformFeeRate: 0.15,
      minOrderBudget: 5.0,
      maxOrderBudget: 100000,
    },
  })
  console.log("Created platform settings")

  // ── Admin User ──────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("admin123", 12)
  await prisma.user.upsert({
    where: { email: "admin@foxolog.com" },
    update: {},
    create: {
      email: "admin@foxolog.com",
      password: adminPassword,
      name: "Admin",
      role: "ADMIN",
    },
  })
  console.log("Created admin user (admin@foxolog.com / admin123)")

  // ── Demo Brand Users ────────────────────────────────────────
  const brand1User = await prisma.user.upsert({
    where: { email: "brand@techglow.com" },
    update: {},
    create: {
      email: "brand@techglow.com",
      password: hashedPassword,
      name: "Sarah Chen",
      role: "BRAND",
    },
  })
  const brand1 = await prisma.brand.upsert({
    where: { userId: brand1User.id },
    update: {},
    create: {
      userId: brand1User.id,
      companyName: "TechGlow",
      website: "https://techglow.example.com",
      industry: "Consumer Electronics",
      description:
        "Smart home gadgets and wearable tech for the modern lifestyle.",
    },
  })

  const brand2User = await prisma.user.upsert({
    where: { email: "brand@fitfuel.com" },
    update: {},
    create: {
      email: "brand@fitfuel.com",
      password: hashedPassword,
      name: "Marcus Rivera",
      role: "BRAND",
    },
  })
  const brand2 = await prisma.brand.upsert({
    where: { userId: brand2User.id },
    update: {},
    create: {
      userId: brand2User.id,
      companyName: "FitFuel Nutrition",
      website: "https://fitfuel.example.com",
      industry: "Health & Fitness",
      description:
        "Plant-based protein supplements and workout nutrition for athletes.",
    },
  })

  const brand3User = await prisma.user.upsert({
    where: { email: "brand@urbanstyle.com" },
    update: {},
    create: {
      email: "brand@urbanstyle.com",
      password: hashedPassword,
      name: "Priya Patel",
      role: "BRAND",
    },
  })
  const brand3 = await prisma.brand.upsert({
    where: { userId: brand3User.id },
    update: {},
    create: {
      userId: brand3User.id,
      companyName: "UrbanStyle Co",
      website: "https://urbanstyle.example.com",
      industry: "Fashion",
      description: "Trendy streetwear and accessories for Gen Z.",
    },
  })
  console.log("Created 3 demo brands")

  // ── Demo Creator Network ────────────────────────────────────
  const networkUser = await prisma.user.upsert({
    where: { email: "network@viralreach.com" },
    update: {},
    create: {
      email: "network@viralreach.com",
      password: hashedPassword,
      name: "Jake Thompson",
      role: "NETWORK",
    },
  })
  const network = await prisma.creatorNetwork.upsert({
    where: { userId: networkUser.id },
    update: {},
    create: {
      userId: networkUser.id,
      companyName: "ViralReach Agency",
      website: "https://viralreach.example.com",
      description:
        "Top-tier TikTok talent management. We connect brands with verified creators across lifestyle, tech, and entertainment.",
    },
  })
  console.log("Created 1 demo network (network@viralreach.com / demo123)")

  // ── Demo Creators ───────────────────────────────────────────
  // Creator 1 — Elite tier, in network
  const creator1User = await prisma.user.upsert({
    where: { email: "creator@emilydance.com" },
    update: {},
    create: {
      email: "creator@emilydance.com",
      password: hashedPassword,
      name: "Emily Zhang",
      role: "CREATOR",
    },
  })
  const creator1 = await prisma.creator.upsert({
    where: { userId: creator1User.id },
    update: {},
    create: {
      userId: creator1User.id,
      tiktokUsername: "emilydancez",
      tiktokVerified: true,
      followerCount: 2400000,
      avgViews: 850000,
      engagementRate: 12.5,
      totalLikes: 45000000,
      totalVideos: 620,
      score: 92,
      tier: 5,
      pricePerThousand: 40,
      bio: "Professional dancer & choreographer. Viral dance challenges and behind-the-scenes content.",
      portfolioLinks: [
        "https://tiktok.com/@emilydancez",
        "https://instagram.com/emilydancez",
      ],
      networkId: network.id,
      metricsUpdatedAt: new Date(),
    },
  })
  await prisma.creatorCategory.createMany({
    data: [
      { creatorId: creator1.id, categoryId: categoryRecords["music"] },
      { creatorId: creator1.id, categoryId: categoryRecords["lifestyle"] },
      { creatorId: creator1.id, categoryId: categoryRecords["fitness"] },
    ],
    skipDuplicates: true,
  })

  // Creator 2 — Premium tier, in network
  const creator2User = await prisma.user.upsert({
    where: { email: "creator@alextech.com" },
    update: {},
    create: {
      email: "creator@alextech.com",
      password: hashedPassword,
      name: "Alex Kim",
      role: "CREATOR",
    },
  })
  const creator2 = await prisma.creator.upsert({
    where: { userId: creator2User.id },
    update: {},
    create: {
      userId: creator2User.id,
      tiktokUsername: "alextechreviews",
      tiktokVerified: true,
      followerCount: 780000,
      avgViews: 320000,
      engagementRate: 8.3,
      totalLikes: 12000000,
      totalVideos: 340,
      score: 74,
      tier: 4,
      pricePerThousand: 20,
      bio: "Tech reviewer. Unboxings, honest reviews, and gadget comparisons.",
      portfolioLinks: ["https://tiktok.com/@alextechreviews"],
      networkId: network.id,
      metricsUpdatedAt: new Date(),
    },
  })
  await prisma.creatorCategory.createMany({
    data: [
      { creatorId: creator2.id, categoryId: categoryRecords["tech"] },
      { creatorId: creator2.id, categoryId: categoryRecords["gaming"] },
    ],
    skipDuplicates: true,
  })

  // Creator 3 — Established tier, independent
  const creator3User = await prisma.user.upsert({
    where: { email: "creator@sofiafood.com" },
    update: {},
    create: {
      email: "creator@sofiafood.com",
      password: hashedPassword,
      name: "Sofia Martinez",
      role: "CREATOR",
    },
  })
  const creator3 = await prisma.creator.upsert({
    where: { userId: creator3User.id },
    update: {},
    create: {
      userId: creator3User.id,
      tiktokUsername: "sofiacooks",
      tiktokVerified: true,
      followerCount: 350000,
      avgViews: 95000,
      engagementRate: 6.1,
      totalLikes: 5200000,
      totalVideos: 210,
      score: 55,
      tier: 3,
      pricePerThousand: 10,
      bio: "Home cook sharing quick, healthy recipes. From my kitchen to yours!",
      portfolioLinks: [
        "https://tiktok.com/@sofiacooks",
        "https://youtube.com/@sofiacooks",
      ],
      metricsUpdatedAt: new Date(),
    },
  })
  await prisma.creatorCategory.createMany({
    data: [
      { creatorId: creator3.id, categoryId: categoryRecords["food"] },
      { creatorId: creator3.id, categoryId: categoryRecords["lifestyle"] },
    ],
    skipDuplicates: true,
  })

  // Creator 4 — Rising tier, independent
  const creator4User = await prisma.user.upsert({
    where: { email: "creator@jamesfitness.com" },
    update: {},
    create: {
      email: "creator@jamesfitness.com",
      password: hashedPassword,
      name: "James Okafor",
      role: "CREATOR",
    },
  })
  const creator4 = await prisma.creator.upsert({
    where: { userId: creator4User.id },
    update: {},
    create: {
      userId: creator4User.id,
      tiktokUsername: "jamesfitlife",
      tiktokVerified: false,
      followerCount: 85000,
      avgViews: 28000,
      engagementRate: 4.2,
      totalLikes: 1100000,
      totalVideos: 95,
      score: 33,
      tier: 2,
      pricePerThousand: 5,
      bio: "Fitness journey & workout tips. Transforming one rep at a time.",
      portfolioLinks: ["https://tiktok.com/@jamesfitlife"],
      metricsUpdatedAt: new Date(),
    },
  })
  await prisma.creatorCategory.createMany({
    data: [
      { creatorId: creator4.id, categoryId: categoryRecords["fitness"] },
      { creatorId: creator4.id, categoryId: categoryRecords["sports"] },
    ],
    skipDuplicates: true,
  })

  // Creator 5 — Starter tier, independent
  const creator5User = await prisma.user.upsert({
    where: { email: "creator@lilybeauty.com" },
    update: {},
    create: {
      email: "creator@lilybeauty.com",
      password: hashedPassword,
      name: "Lily Nguyen",
      role: "CREATOR",
    },
  })
  const creator5 = await prisma.creator.upsert({
    where: { userId: creator5User.id },
    update: {},
    create: {
      userId: creator5User.id,
      tiktokUsername: "lilyglowup",
      tiktokVerified: false,
      followerCount: 12000,
      avgViews: 4500,
      engagementRate: 3.0,
      totalLikes: 180000,
      totalVideos: 42,
      score: 15,
      tier: 1,
      pricePerThousand: 2,
      bio: "Beauty & skincare tips for beginners.",
      portfolioLinks: [],
      metricsUpdatedAt: new Date(),
    },
  })
  await prisma.creatorCategory.createMany({
    data: [
      { creatorId: creator5.id, categoryId: categoryRecords["beauty"] },
      { creatorId: creator5.id, categoryId: categoryRecords["fashion"] },
    ],
    skipDuplicates: true,
  })
  console.log("Created 5 demo creators across all tiers")

  // ── Demo Orders (various statuses) ─────────────────────────
  // Order 1 — COMPLETED (TechGlow → Emily, delivered & paid)
  const order1 = await prisma.order.create({
    data: {
      brandId: brand1.id,
      title: "Smart Watch Launch Video",
      description:
        "Create a 30-60 second TikTok showcasing our new GlowFit smartwatch. Focus on style, fitness tracking, and daily use.",
      brief:
        "Key points: waterproof, 7-day battery, sleep tracking. Show unboxing + wearing it during workout. Use trending audio.",
      categoryId: categoryRecords["tech"],
      impressionTarget: 500000,
      budget: 20000,
      cpmRate: 40,
      status: "COMPLETED",
      paymentStatus: "RELEASED",
      maxCreators: 1,
    },
  })
  await prisma.orderAssignment.create({
    data: {
      orderId: order1.id,
      creatorId: creator1.id,
      status: "COMPLETED",
      completedAt: new Date("2026-03-10"),
    },
  })
  await prisma.delivery.create({
    data: {
      orderId: order1.id,
      tiktokLink: "https://tiktok.com/@emilydancez/video/demo001",
      impressions: 620000,
      views: 580000,
      likes: 42000,
      comments: 1800,
      shares: 3200,
      notes: "Exceeded impression target by 24%!",
      approved: true,
      reviewedAt: new Date("2026-03-10"),
    },
  })
  await prisma.transaction.create({
    data: {
      orderId: order1.id,
      amount: 20000,
      platformFee: 3000,
      creatorPayout: 17000,
      status: "RELEASED",
    },
  })

  // Order 2 — DELIVERED (FitFuel → Sofia, awaiting brand approval)
  const order2 = await prisma.order.create({
    data: {
      brandId: brand2.id,
      title: "Protein Shake Morning Routine",
      description:
        "Integrate our plant-based protein into a morning routine video. Show prep and taste reaction.",
      brief:
        "Highlight: vanilla flavor, 25g protein, plant-based. Natural kitchen setting. Authentic reaction.",
      categoryId: categoryRecords["food"],
      impressionTarget: 100000,
      budget: 1000,
      cpmRate: 10,
      status: "DELIVERED",
      paymentStatus: "HELD",
      maxCreators: 1,
    },
  })
  await prisma.orderAssignment.create({
    data: {
      orderId: order2.id,
      creatorId: creator3.id,
      status: "DELIVERED",
    },
  })
  await prisma.delivery.create({
    data: {
      orderId: order2.id,
      tiktokLink: "https://tiktok.com/@sofiacooks/video/demo002",
      impressions: 110000,
      views: 98000,
      likes: 6500,
      comments: 420,
      shares: 180,
      notes: "Added a smoothie bowl twist to make it more engaging!",
    },
  })
  await prisma.transaction.create({
    data: {
      orderId: order2.id,
      amount: 1000,
      platformFee: 150,
      creatorPayout: 850,
      status: "HELD",
    },
  })

  // Order 3 — IN_PROGRESS (UrbanStyle → James, working on it)
  const order3 = await prisma.order.create({
    data: {
      brandId: brand3.id,
      title: "Summer Streetwear Lookbook",
      description:
        "Style 3 outfits from our summer collection. Show transitions between looks.",
      brief:
        "Use outfit transition trend. Tag @urbanstyleco. Feature at least 3 pieces from summer drop.",
      categoryId: categoryRecords["fashion"],
      impressionTarget: 50000,
      budget: 250,
      cpmRate: 5,
      status: "IN_PROGRESS",
      paymentStatus: "HELD",
      maxCreators: 1,
    },
  })
  await prisma.orderAssignment.create({
    data: {
      orderId: order3.id,
      creatorId: creator4.id,
      status: "IN_PROGRESS",
    },
  })
  await prisma.transaction.create({
    data: {
      orderId: order3.id,
      amount: 250,
      platformFee: 37.5,
      creatorPayout: 212.5,
      status: "HELD",
    },
  })

  // Order 4 — OPEN (TechGlow, looking for creators)
  await prisma.order.create({
    data: {
      brandId: brand1.id,
      title: "Smart Speaker Comparison Video",
      description:
        "Compare our EchoGlow speaker with competitors. Honest review style, showcasing sound quality and smart features.",
      brief:
        "Compare with 2 competitors. Show setup, voice control, music quality. 45-90 seconds.",
      categoryId: categoryRecords["tech"],
      impressionTarget: 200000,
      budget: 4000,
      cpmRate: 20,
      status: "OPEN",
      paymentStatus: "HELD",
      maxCreators: 2,
      expiresAt: new Date("2026-04-15"),
    },
  })

  // Order 5 — OPEN (FitFuel, looking for fitness creators)
  await prisma.order.create({
    data: {
      brandId: brand2.id,
      title: "Pre-Workout Energy Drink Challenge",
      description:
        "Film a workout before/after using our new energy drink. Show the energy difference.",
      brief:
        "Split screen: tired vs energized. Natural gym setting. Mention key ingredients.",
      categoryId: categoryRecords["fitness"],
      impressionTarget: 75000,
      budget: 375,
      cpmRate: 5,
      status: "OPEN",
      paymentStatus: "HELD",
      maxCreators: 3,
      expiresAt: new Date("2026-04-20"),
    },
  })

  // Order 6 — REVISION (UrbanStyle → Lily, needs redo)
  const order6 = await prisma.order.create({
    data: {
      brandId: brand3.id,
      title: "Spring Accessories Haul",
      description:
        "Unbox and try on items from our spring accessories collection. React to each piece.",
      brief:
        "At least 5 items. Close-up shots. Mention material quality and pricing.",
      categoryId: categoryRecords["fashion"],
      impressionTarget: 20000,
      budget: 40,
      cpmRate: 2,
      status: "REVISION",
      paymentStatus: "HELD",
      maxCreators: 1,
    },
  })
  await prisma.orderAssignment.create({
    data: {
      orderId: order6.id,
      creatorId: creator5.id,
      status: "REVISION",
    },
  })
  await prisma.delivery.create({
    data: {
      orderId: order6.id,
      tiktokLink: "https://tiktok.com/@lilyglowup/video/demo006",
      impressions: 5200,
      views: 4800,
      likes: 320,
      comments: 45,
      shares: 12,
      notes: "First attempt at accessories content!",
      approved: false,
      reviewedAt: new Date("2026-03-20"),
      rejectionReason:
        "Please show close-up shots of the jewelry and mention the material quality as specified in the brief.",
    },
  })
  await prisma.transaction.create({
    data: {
      orderId: order6.id,
      amount: 40,
      platformFee: 6,
      creatorPayout: 34,
      status: "HELD",
    },
  })

  // Order 7 — DISPUTED (FitFuel → Alex via network)
  const order7 = await prisma.order.create({
    data: {
      brandId: brand2.id,
      title: "Supplement Stack Review",
      description:
        "Review our top 3 supplements. Explain benefits of each and show daily routine.",
      brief:
        "Cover protein, creatine, and pre-workout. Science-backed talking points provided.",
      categoryId: categoryRecords["fitness"],
      impressionTarget: 150000,
      budget: 3000,
      cpmRate: 20,
      status: "DISPUTED",
      paymentStatus: "HELD",
      maxCreators: 1,
    },
  })
  await prisma.orderAssignment.create({
    data: {
      orderId: order7.id,
      creatorId: creator2.id,
      networkId: network.id,
      status: "DISPUTED",
    },
  })
  await prisma.delivery.create({
    data: {
      orderId: order7.id,
      tiktokLink: "https://tiktok.com/@alextechreviews/video/demo007",
      impressions: 280000,
      views: 260000,
      likes: 18000,
      comments: 900,
      shares: 1400,
      notes: "Covered all 3 products with honest review approach.",
      approved: false,
      reviewedAt: new Date("2026-03-18"),
      rejectionReason:
        "Video included negative comments about taste which was not in the brief scope.",
    },
  })
  await prisma.transaction.create({
    data: {
      orderId: order7.id,
      amount: 3000,
      platformFee: 450,
      creatorPayout: 2550,
      status: "HELD",
    },
  })

  // Create support ticket for the dispute
  await prisma.supportTicket.create({
    data: {
      creatorId: creator2User.id,
      subject: "Dispute: Supplement Stack Review - Unfair Rejection",
      description:
        "Brand rejected my delivery claiming negative comments, but the brief said 'honest review'. I exceeded the impression target by 87%. Requesting admin review.",
      status: "OPEN",
      priority: 2,
      messages: {
        create: [
          {
            senderId: creator2User.id,
            message:
              "The brief explicitly said 'honest review style'. I mentioned the taste could be improved but was overwhelmingly positive about effectiveness. The video exceeded impression targets significantly.",
          },
          {
            senderId: brand2User.id,
            message:
              "We expected a positive review highlighting benefits, not criticism of our products. The taste comment went viral in the wrong way.",
          },
        ],
      },
    },
  })

  console.log(
    "Created 7 demo orders (completed, delivered, in_progress, 2x open, revision, disputed)"
  )
  console.log("Created 1 support ticket with dispute messages")

  // ── Summary ─────────────────────────────────────────────────
  console.log("\n--- Seed Complete ---")
  console.log("Admin:    admin@foxolog.com / admin123")
  console.log("Brands:   brand@techglow.com / demo123")
  console.log("          brand@fitfuel.com / demo123")
  console.log("          brand@urbanstyle.com / demo123")
  console.log("Network:  network@viralreach.com / demo123")
  console.log("Creators: creator@emilydance.com / demo123  (Tier 5 - Elite)")
  console.log("          creator@alextech.com / demo123    (Tier 4 - Premium)")
  console.log("          creator@sofiafood.com / demo123   (Tier 3 - Established)")
  console.log("          creator@jamesfitness.com / demo123 (Tier 2 - Rising)")
  console.log("          creator@lilybeauty.com / demo123  (Tier 1 - Starter)")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
