import { UserRole, OrderStatus, PaymentStatus } from "@prisma/client"

export type { UserRole, OrderStatus, PaymentStatus }

export interface SessionUser {
  id: string
  email: string
  name: string
  role: UserRole
  image?: string | null
}

export interface CreatorWithUser {
  id: string
  userId: string
  tiktokUsername: string
  tiktokVerified: boolean
  followerCount: number
  avgViews: number
  engagementRate: number
  score: number
  tier: number
  pricePerThousand: number
  bio: string | null
  portfolioLinks: string[]
  stripeOnboarded: boolean
  user: {
    name: string
    email: string
    avatar: string | null
  }
  categories: {
    category: {
      id: string
      name: string
      slug: string
    }
  }[]
}

export interface OrderWithRelations {
  id: string
  title: string
  description: string
  brief: string | null
  impressionTarget: number
  budget: number
  cpmRate: number
  status: OrderStatus
  maxCreators: number
  paymentStatus: PaymentStatus
  createdAt: Date
  expiresAt: Date | null
  brand: {
    companyName: string
    user: {
      name: string
    }
  }
  category: {
    id: string
    name: string
    slug: string
  }
  assignments: {
    id: string
    creator: {
      id: string
      tiktokUsername: string
      user: { name: string }
    } | null
    network: {
      id: string
      companyName: string
    } | null
    status: OrderStatus
  }[]
  deliveries: {
    id: string
    tiktokLink: string
    impressions: number | null
    approved: boolean | null
    submittedAt: Date
  }[]
  _count: {
    assignments: number
  }
}
