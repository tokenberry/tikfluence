import Anthropic from "@anthropic-ai/sdk"
import { prisma } from "./prisma"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? "",
})

interface CreatorData {
  id: string
  tiktokUsername: string
  followerCount: number
  avgViews: number
  engagementRate: number
  totalLikes: number
  totalVideos: number
  score: number
  tier: number
  pricePerThousand: number
  bio: string | null
  categories: string[]
  portfolioLinks: string[]
  supportsLive: boolean
  supportsShortVideo: boolean
}

interface CreatorAnalysisResult {
  summary: string
  strengths: string[]
  weaknesses: string[]
  bestContentTypes: string[]
  audienceInsights: string | null
  contentStyle: string | null
  recommendedCpm: number | null
}

export async function analyzeCreator(creatorData: CreatorData): Promise<CreatorAnalysisResult> {
  const prompt = `You are a TikTok influencer marketing analyst for Foxolog, a professional influencer marketplace. Analyze this creator's profile and metrics to provide actionable insights.

Creator Profile:
- TikTok Username: @${creatorData.tiktokUsername}
- Followers: ${creatorData.followerCount.toLocaleString()}
- Average Views per Video: ${creatorData.avgViews.toLocaleString()}
- Engagement Rate: ${creatorData.engagementRate.toFixed(2)}%
- Total Likes: ${creatorData.totalLikes.toLocaleString()}
- Total Videos: ${creatorData.totalVideos}
- Current Score: ${creatorData.score.toFixed(1)}/100
- Current Tier: ${creatorData.tier}/5
- Current CPM: $${creatorData.pricePerThousand.toFixed(2)}
- Bio: ${creatorData.bio || "Not provided"}
- Categories: ${creatorData.categories.length > 0 ? creatorData.categories.join(", ") : "None specified"}
- Portfolio Links: ${creatorData.portfolioLinks.length > 0 ? creatorData.portfolioLinks.join(", ") : "None"}
- Supports LIVE: ${creatorData.supportsLive ? "Yes" : "No"}
- Supports Short Video: ${creatorData.supportsShortVideo ? "Yes" : "No"}

Provide your analysis as JSON with this exact structure:
{
  "summary": "2-3 sentence overall assessment of this creator's value for brand partnerships",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["area for improvement 1", "area for improvement 2"],
  "bestContentTypes": ["SHORT_VIDEO" and/or "LIVE" - which format suits them best],
  "audienceInsights": "Analysis of likely audience demographics and engagement patterns based on their metrics and categories",
  "contentStyle": "Description of their likely content approach and style",
  "recommendedCpm": <number - suggested fair CPM rate in USD based on their metrics>
}

Be honest and specific. Base your analysis on the metrics provided. If engagement rate is high relative to follower count, note that. If video output is low, flag consistency concerns. For LIVE suitability, consider if their engagement patterns suggest an interactive audience.

Respond ONLY with the JSON object, no additional text.`

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  })

  const text = response.content[0].type === "text" ? response.content[0].text : ""
  const parsed = JSON.parse(text) as CreatorAnalysisResult

  // Store in database
  await prisma.aiCreatorAnalysis.create({
    data: {
      creatorId: creatorData.id,
      summary: parsed.summary,
      strengths: parsed.strengths,
      weaknesses: parsed.weaknesses,
      bestContentTypes: parsed.bestContentTypes,
      audienceInsights: parsed.audienceInsights,
      contentStyle: parsed.contentStyle,
      recommendedCpm: parsed.recommendedCpm,
    },
  })

  return parsed
}

export async function getLatestCreatorAnalysis(creatorId: string) {
  return prisma.aiCreatorAnalysis.findFirst({
    where: { creatorId },
    orderBy: { createdAt: "desc" },
  })
}

// ──── Post-Delivery AI Analysis ────

interface DeliveryAnalysisInput {
  orderId: string
  deliveryId: string
  orderTitle: string
  orderDescription: string
  orderBrief: string | null
  orderType: string
  impressionTarget: number
  budget: number
  cpmRate: number
  liveFlatFee: number | null
  liveMinDuration: number | null
  // Delivery metrics
  deliveryType: string
  impressions: number | null
  views: number | null
  likes: number | null
  comments: number | null
  shares: number | null
  streamDuration: number | null
  peakViewers: number | null
  avgConcurrentViewers: number | null
  chatMessages: number | null
  giftsValue: number | null
  // Creator context
  creatorUsername: string
  creatorFollowers: number
  creatorEngagementRate: number
}

interface DeliveryAnalysisResult {
  performanceSummary: string
  performanceScore: number
  metricsBreakdown: string
  briefAlignment: string
  audienceEngagement: string
  strengths: string[]
  improvements: string[]
  whatsNext: string[]
  recommendedNextOrder: string | null
}

export async function analyzeDelivery(input: DeliveryAnalysisInput): Promise<DeliveryAnalysisResult> {
  const metricsSection = input.deliveryType === "LIVE"
    ? `LIVE Stream Metrics:
- Stream Duration: ${input.streamDuration ?? 0} minutes
- Peak Viewers: ${input.peakViewers ?? 0}
- Avg Concurrent Viewers: ${input.avgConcurrentViewers ?? 0}
- Chat Messages: ${input.chatMessages ?? 0}
- Gifts Value: $${(input.giftsValue ?? 0).toFixed(2)}`
    : `Short Video Metrics:
- Impressions: ${(input.impressions ?? 0).toLocaleString()} (target: ${input.impressionTarget.toLocaleString()})
- Views: ${(input.views ?? 0).toLocaleString()}
- Likes: ${(input.likes ?? 0).toLocaleString()}
- Comments: ${(input.comments ?? 0).toLocaleString()}
- Shares: ${(input.shares ?? 0).toLocaleString()}`

  const prompt = `You are a TikTok campaign performance analyst for Foxolog, a professional influencer marketplace. Analyze this completed delivery and provide actionable insights.

Campaign Details:
- Title: ${input.orderTitle}
- Description: ${input.orderDescription}
- Brief: ${input.orderBrief || "No detailed brief provided"}
- Order Type: ${input.orderType}
- Budget: $${input.budget.toFixed(2)}
- CPM Rate: $${input.cpmRate.toFixed(2)}
${input.liveFlatFee ? `- LIVE Flat Fee: $${input.liveFlatFee.toFixed(2)}` : ""}
${input.liveMinDuration ? `- Min LIVE Duration: ${input.liveMinDuration} minutes` : ""}

Creator Context:
- Username: @${input.creatorUsername}
- Followers: ${input.creatorFollowers.toLocaleString()}
- Engagement Rate: ${input.creatorEngagementRate.toFixed(2)}%

Delivery (${input.deliveryType}):
${metricsSection}

Provide your analysis as JSON with this exact structure:
{
  "performanceSummary": "2-3 sentence overall assessment of the delivery performance and ROI",
  "performanceScore": <0-100 integer rating the overall delivery quality>,
  "metricsBreakdown": "Detailed analysis of each metric vs expectations. Was the impression target met? How do engagement rates compare to creator's average? For LIVE: was duration sufficient, were viewers engaged?",
  "briefAlignment": "How well did the delivery align with the campaign brief and brand goals?",
  "audienceEngagement": "Analysis of audience interaction quality (likes-to-views ratio, comments quality, share virality, or LIVE chat activity)",
  "strengths": ["what went well 1", "what went well 2", "what went well 3"],
  "improvements": ["what could be better 1", "what could be better 2"],
  "whatsNext": ["actionable suggestion 1 for the brand's next campaign", "suggestion 2", "suggestion 3"],
  "recommendedNextOrder": "Specific recommendation for the next campaign type and approach with this creator or similar creators"
}

Be data-driven and specific. Reference actual numbers. If impressions exceeded target, calculate by how much. If engagement is high/low relative to follower count, explain why. The "whatsNext" suggestions should be practical and actionable for the brand.

Respond ONLY with the JSON object, no additional text.`

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  })

  const text = response.content[0].type === "text" ? response.content[0].text : ""
  const parsed = JSON.parse(text) as DeliveryAnalysisResult

  // Store in database
  await prisma.aiDeliveryAnalysis.create({
    data: {
      orderId: input.orderId,
      deliveryId: input.deliveryId,
      performanceSummary: parsed.performanceSummary,
      performanceScore: parsed.performanceScore,
      metricsBreakdown: parsed.metricsBreakdown,
      briefAlignment: parsed.briefAlignment,
      audienceEngagement: parsed.audienceEngagement,
      strengths: parsed.strengths,
      improvements: parsed.improvements,
      whatsNext: parsed.whatsNext,
      recommendedNextOrder: parsed.recommendedNextOrder,
    },
  })

  return parsed
}

export async function getDeliveryAnalysis(orderId: string) {
  return prisma.aiDeliveryAnalysis.findFirst({
    where: { orderId },
    orderBy: { createdAt: "desc" },
  })
}
