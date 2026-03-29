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
