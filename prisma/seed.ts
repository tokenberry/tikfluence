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

  // Create categories
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    })
  }
  console.log(`Created ${categories.length} categories`)

  // Create platform settings
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

  // Create admin user
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

  console.log("Seeding complete!")
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
