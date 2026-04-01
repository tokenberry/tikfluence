interface CreatorMetrics {
  followerCount: number
  avgViews: number
  engagementRate: number
  totalVideos: number
  bio: string | null
  categoryCount: number
  portfolioLinkCount: number
}

interface ScoreResult {
  score: number
  tier: number
  pricePerThousand: number
}

const TIER_PRICING: Record<number, number> = {
  1: 2,
  2: 5,
  3: 10,
  4: 20,
  5: 40,
}

function normalizeLog(value: number, max: number): number {
  if (value <= 0) return 0
  const normalized = (Math.log10(value) / Math.log10(max)) * 100
  return Math.min(100, Math.max(0, normalized))
}

function calculateEngagementScore(engagementRate: number): number {
  // Engagement rate typically 1-20% for TikTok
  // Smooth curve: 0% → 0, 2% → 30, 5% → 65, 10% → 100
  if (engagementRate <= 0) return 0
  if (engagementRate >= 10) return 100
  if (engagementRate >= 5) return 65 + (engagementRate - 5) * 7
  if (engagementRate >= 2) return 30 + (engagementRate - 2) * (35 / 3)
  return engagementRate * 15
}

function calculateConsistencyScore(totalVideos: number): number {
  // Based on total video count as a proxy for consistency
  // 100+ videos = very consistent
  if (totalVideos >= 500) return 100
  if (totalVideos >= 100) return 60 + (totalVideos - 100) * (40 / 400)
  if (totalVideos >= 20) return 20 + (totalVideos - 20) * (40 / 80)
  return totalVideos
}

function calculateProfileScore(
  bio: string | null,
  categoryCount: number,
  portfolioLinkCount: number
): number {
  let score = 0
  if (bio && bio.length > 10) score += 40
  if (categoryCount >= 1) score += 30
  if (categoryCount >= 3) score += 10
  if (portfolioLinkCount >= 1) score += 20
  return Math.min(100, score)
}

export function calculateCreatorScore(metrics: CreatorMetrics): ScoreResult {
  const engagementScore = calculateEngagementScore(metrics.engagementRate)
  const followerScore = normalizeLog(metrics.followerCount, 100_000_000) // 100M max
  const viewScore = normalizeLog(metrics.avgViews, 10_000_000) // 10M max
  const consistencyScore = calculateConsistencyScore(metrics.totalVideos)
  const profileScore = calculateProfileScore(
    metrics.bio,
    metrics.categoryCount,
    metrics.portfolioLinkCount
  )

  // Weighted score
  const score =
    engagementScore * 0.3 +
    viewScore * 0.25 +
    followerScore * 0.2 +
    consistencyScore * 0.15 +
    profileScore * 0.1

  const roundedScore = Math.round(score * 100) / 100

  // Determine tier
  let tier: number
  if (roundedScore >= 81) tier = 5
  else if (roundedScore >= 61) tier = 4
  else if (roundedScore >= 41) tier = 3
  else if (roundedScore >= 21) tier = 2
  else tier = 1

  return {
    score: roundedScore,
    tier,
    pricePerThousand: TIER_PRICING[tier],
  }
}

export function getTierLabel(tier: number): string {
  const labels: Record<number, string> = {
    1: "Starter",
    2: "Rising",
    3: "Established",
    4: "Premium",
    5: "Elite",
  }
  return labels[tier] || "Unknown"
}
