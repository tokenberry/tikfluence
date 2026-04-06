import { describe, it, expect } from "vitest"
import { calculateCreatorScore, getTierLabel } from "@/lib/scoring"

describe("calculateCreatorScore", () => {
  it("returns tier 1 for a minimal creator", () => {
    const result = calculateCreatorScore({
      followerCount: 100,
      avgViews: 50,
      engagementRate: 0.5,
      totalVideos: 2,
      bio: null,
      categoryCount: 0,
      portfolioLinkCount: 0,
    })

    expect(result.tier).toBe(1)
    expect(result.pricePerThousand).toBe(2)
    expect(result.score).toBeLessThan(21)
  })

  it("returns tier 5 for an elite creator", () => {
    const result = calculateCreatorScore({
      followerCount: 10_000_000,
      avgViews: 2_000_000,
      engagementRate: 12,
      totalVideos: 600,
      bio: "Professional TikTok creator with years of experience",
      categoryCount: 5,
      portfolioLinkCount: 3,
    })

    expect(result.tier).toBe(5)
    expect(result.pricePerThousand).toBe(40)
    expect(result.score).toBeGreaterThanOrEqual(81)
  })

  it("returns tier 3 for a mid-range creator", () => {
    const result = calculateCreatorScore({
      followerCount: 50_000,
      avgViews: 10_000,
      engagementRate: 5,
      totalVideos: 100,
      bio: "Content creator focusing on lifestyle",
      categoryCount: 2,
      portfolioLinkCount: 1,
    })

    expect(result.tier).toBeGreaterThanOrEqual(2)
    expect(result.tier).toBeLessThanOrEqual(4)
    expect(result.score).toBeGreaterThan(20)
  })

  it("score is between 0 and 100", () => {
    const result = calculateCreatorScore({
      followerCount: 1_000_000,
      avgViews: 500_000,
      engagementRate: 8,
      totalVideos: 300,
      bio: "A decent bio here",
      categoryCount: 3,
      portfolioLinkCount: 2,
    })

    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })

  it("handles zero values gracefully", () => {
    const result = calculateCreatorScore({
      followerCount: 0,
      avgViews: 0,
      engagementRate: 0,
      totalVideos: 0,
      bio: null,
      categoryCount: 0,
      portfolioLinkCount: 0,
    })

    expect(result.tier).toBe(1)
    expect(result.score).toBe(0)
    expect(result.pricePerThousand).toBe(2)
  })

  it("profile completeness affects score", () => {
    const base = {
      followerCount: 10_000,
      avgViews: 5_000,
      engagementRate: 3,
      totalVideos: 50,
    }

    const withoutProfile = calculateCreatorScore({
      ...base,
      bio: null,
      categoryCount: 0,
      portfolioLinkCount: 0,
    })

    const withProfile = calculateCreatorScore({
      ...base,
      bio: "Professional content creator",
      categoryCount: 3,
      portfolioLinkCount: 2,
    })

    expect(withProfile.score).toBeGreaterThan(withoutProfile.score)
  })
})

describe("getTierLabel", () => {
  it("returns correct labels for each tier", () => {
    expect(getTierLabel(1)).toBe("Starter")
    expect(getTierLabel(2)).toBe("Rising")
    expect(getTierLabel(3)).toBe("Established")
    expect(getTierLabel(4)).toBe("Premium")
    expect(getTierLabel(5)).toBe("Elite")
  })

  it("returns Unknown for invalid tier", () => {
    expect(getTierLabel(0)).toBe("Unknown")
    expect(getTierLabel(6)).toBe("Unknown")
  })
})
