import { prisma } from "./prisma"
import { z } from "zod"
import { logger } from "@/lib/logger"

const log = logger.child({ module: "ai" })
const AI_TIMEOUT_MS = 60_000

const creatorAnalysisSchema = z.object({
  summary: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  bestContentTypes: z.array(z.string()),
  audienceInsights: z.string().nullable(),
  contentStyle: z.string().nullable(),
  recommendedCpm: z.number().nullable(),
})

const deliveryAnalysisSchema = z.object({
  performanceSummary: z.string(),
  performanceScore: z.number().min(0).max(100),
  metricsBreakdown: z.string(),
  briefAlignment: z.string(),
  audienceEngagement: z.string(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  whatsNext: z.array(z.string()),
  recommendedNextOrder: z.string().nullable(),
})

function getOpenAIApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured")
  }
  return apiKey
}

async function callAI(prompt: string, maxTokens: number): Promise<string> {
  const apiKey = getOpenAIApiKey()

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS)

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error")
      throw new Error(`OpenAI request failed (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      throw new Error("OpenAI returned empty response")
    }
    return content
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("OpenAI request timed out after 60 seconds")
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

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
  const prompt = `You are a TikTok influencer marketing analyst for Foxolog, a professional influencer marketplace. Analyze this creator's profile and metrics to provide actionable insights for brands looking to hire them.

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

  const text = await callAI(prompt, 1024)

  let parsed: CreatorAnalysisResult
  try {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const jsonText = jsonMatch ? jsonMatch[0] : text
    const json = JSON.parse(jsonText)
    parsed = creatorAnalysisSchema.parse(json)
  } catch (err) {
    log.error(
      {
        event: "ai_creator_analysis_parse_failed",
        err,
        preview: text.slice(0, 200),
      },
      "Failed to parse AI creator analysis response"
    )
    throw new Error(
      err instanceof z.ZodError
        ? `AI response validation failed: ${err.issues.map((i) => i.message).join(", ")}`
        : "AI returned invalid JSON for creator analysis"
    )
  }

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
  "metricsBreakdown": "Detailed analysis of each metric vs expectations",
  "briefAlignment": "How well did the delivery align with the campaign brief and brand goals?",
  "audienceEngagement": "Analysis of audience interaction quality",
  "strengths": ["what went well 1", "what went well 2", "what went well 3"],
  "improvements": ["what could be better 1", "what could be better 2"],
  "whatsNext": ["actionable suggestion 1", "suggestion 2", "suggestion 3"],
  "recommendedNextOrder": "Specific recommendation for the next campaign"
}

Be data-driven and specific. Reference actual numbers.

Respond ONLY with the JSON object, no additional text.`

  const text = await callAI(prompt, 1500)

  let parsed: DeliveryAnalysisResult
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const jsonText = jsonMatch ? jsonMatch[0] : text
    const json = JSON.parse(jsonText)
    parsed = deliveryAnalysisSchema.parse(json)
  } catch (err) {
    log.error(
      {
        event: "ai_delivery_analysis_parse_failed",
        err,
        preview: text.slice(0, 200),
      },
      "Failed to parse AI delivery analysis response"
    )
    throw new Error(
      err instanceof z.ZodError
        ? `AI response validation failed: ${err.issues.map((i) => i.message).join(", ")}`
        : "AI returned invalid JSON for delivery analysis"
    )
  }

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

// ──── Campaign-Driven Creator Matching (F4) ────

/// Hard cap on how many creators we send into the prompt in a single
/// request. Keeping the pool small keeps prompt size (and AI cost + latency)
/// bounded and well inside the 60s request budget even on slow days.
const MATCH_CANDIDATE_POOL = 50
/// Hard cap on how many matches we return to the caller. The AI may
/// return fewer (if the pool is small); it must not return more.
const MATCH_RESULT_CAP = 10

/// Structured per-factor reasoning the AI produces for every match
/// row. Stored in `AiCreatorMatch.reasoning` as JSON so the front-end
/// can later render an expandable breakdown without another migration.
const matchReasoningSchema = z.object({
  audienceFit: z.string().nullable(),
  categoryFit: z.string().nullable(),
  contentStyleFit: z.string().nullable(),
  budgetFit: z.string().nullable(),
  engagementQuality: z.string().nullable(),
})

const singleMatchSchema = z.object({
  creatorId: z.string(),
  matchScore: z.number().min(0).max(100),
  matchReason: z.string().min(1).max(500),
  reasoning: matchReasoningSchema.nullable(),
})

const matchResponseSchema = z.object({
  matches: z.array(singleMatchSchema),
})

export type CreatorMatchReasoning = z.infer<typeof matchReasoningSchema>

export interface MatchOrderInput {
  orderId: string
  title: string
  description: string
  brief: string | null
  categoryName: string
  orderType: string
  budget: number
  cpmRate: number
  impressionTarget: number
  liveFlatFee: number | null
  liveMinDuration: number | null
  requiresShipping: boolean
}

export interface MatchCandidate {
  id: string
  tiktokUsername: string
  name: string | null
  followerCount: number
  avgViews: number
  engagementRate: number
  score: number
  tier: number
  pricePerThousand: number
  bio: string | null
  categories: string[]
  supportsLive: boolean
  supportsShortVideo: boolean
}

export interface MatchResultRow {
  creatorId: string
  matchScore: number
  matchReason: string
  reasoning: CreatorMatchReasoning | null
}

/**
 * Rank a pool of candidate creators against an order using GPT-4o-mini
 * and return up to `MATCH_RESULT_CAP` best matches with short rationales.
 * The caller is responsible for loading candidates from Prisma and
 * persisting the returned rows into `AiCreatorMatch`.
 *
 * This function is pure(ish): it calls the AI, parses + validates the
 * response, and returns the ranked rows. No database writes here —
 * the route handler owns persistence so it can also stamp
 * `order.matchesGeneratedAt` in the same transaction.
 */
export async function matchCreatorsToOrder(
  order: MatchOrderInput,
  candidates: MatchCandidate[]
): Promise<MatchResultRow[]> {
  if (candidates.length === 0) return []

  const pool = candidates.slice(0, MATCH_CANDIDATE_POOL)
  const poolJson = pool.map((c) => ({
    creatorId: c.id,
    username: c.tiktokUsername,
    name: c.name ?? null,
    followers: c.followerCount,
    avgViews: c.avgViews,
    engagementRate: Number(c.engagementRate.toFixed(2)),
    score: Number(c.score.toFixed(1)),
    tier: c.tier,
    cpm: Number(c.pricePerThousand.toFixed(2)),
    bio: c.bio ?? null,
    categories: c.categories,
    supportsLive: c.supportsLive,
    supportsShortVideo: c.supportsShortVideo,
  }))

  const prompt = `You are a TikTok influencer matching analyst for Foxolog, a professional influencer marketplace. A brand has created a campaign and you must identify the best-fit creators from the supplied candidate pool.

Campaign:
- Title: ${order.title}
- Description: ${order.description}
- Brief: ${order.brief ?? "No detailed brief provided"}
- Category: ${order.categoryName}
- Order Type: ${order.orderType}${
    order.orderType === "SHORT_VIDEO" || order.orderType === "COMBO"
      ? `\n- Impression Target: ${order.impressionTarget.toLocaleString()}\n- Budget: $${order.budget.toFixed(2)}\n- Target CPM: $${order.cpmRate.toFixed(2)}`
      : ""
  }${
    order.orderType === "LIVE" || order.orderType === "COMBO"
      ? `\n- LIVE Flat Fee: $${(order.liveFlatFee ?? 0).toFixed(2)}${
          order.liveMinDuration
            ? `\n- Min LIVE Duration: ${order.liveMinDuration} min`
            : ""
        }`
      : ""
  }
- Requires Physical Product Shipping: ${order.requiresShipping ? "Yes" : "No"}

Candidate Creators (pool size: ${pool.length}):
${JSON.stringify(poolJson, null, 2)}

Score each creator from 0 (terrible fit) to 100 (perfect fit) based on:
1. Category/niche fit with the campaign topic
2. Audience size and engagement quality vs the campaign's impression target
3. Content format alignment (supportsLive / supportsShortVideo vs order type)
4. Price fit (creator's CPM vs campaign CPM target — below or equal is ideal)
5. Content style / bio alignment with the brand's message

Return ONLY a JSON object with this exact structure:
{
  "matches": [
    {
      "creatorId": "<exact creatorId from the pool>",
      "matchScore": <0-100>,
      "matchReason": "1-2 sentence plain-English rationale (max 500 chars)",
      "reasoning": {
        "audienceFit": "short note or null",
        "categoryFit": "short note or null",
        "contentStyleFit": "short note or null",
        "budgetFit": "short note or null",
        "engagementQuality": "short note or null"
      }
    }
  ]
}

Rules:
- Return at most ${MATCH_RESULT_CAP} rows.
- Return rows sorted by matchScore DESC.
- Only include creators you consider a reasonable fit (matchScore >= 40).
- Use the creatorId exactly as given — never invent ids.
- Respond with the JSON object ONLY, no prose, no markdown fences.`

  const text = await callAI(prompt, 2048)

  let parsed: z.infer<typeof matchResponseSchema>
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const jsonText = jsonMatch ? jsonMatch[0] : text
    const json = JSON.parse(jsonText)
    parsed = matchResponseSchema.parse(json)
  } catch (err) {
    log.error(
      {
        event: "ai_match_parse_failed",
        err,
        preview: text.slice(0, 300),
      },
      "Failed to parse AI creator match response"
    )
    throw new Error(
      err instanceof z.ZodError
        ? `AI response validation failed: ${err.issues.map((i) => i.message).join(", ")}`
        : "AI returned invalid JSON for creator matching"
    )
  }

  const validIds = new Set(pool.map((c) => c.id))
  const rows = parsed.matches
    .filter((m) => validIds.has(m.creatorId))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, MATCH_RESULT_CAP)

  return rows.map((m) => ({
    creatorId: m.creatorId,
    matchScore: m.matchScore,
    matchReason: m.matchReason,
    reasoning: m.reasoning,
  }))
}
