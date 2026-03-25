interface TikTokUserInfo {
  tiktokId: string
  username: string
  displayName: string
  followerCount: number
  followingCount: number
  totalLikes: number
  totalVideos: number
  bio: string
  avatar: string
}

interface TikTokVideoMetrics {
  avgViews: number
  avgLikes: number
  avgComments: number
  avgShares: number
  engagementRate: number
}

export interface TikTokCreatorData {
  userInfo: TikTokUserInfo
  videoMetrics: TikTokVideoMetrics
}

const TIKTOK_API_BASE = "https://open.tiktokapis.com/v2"

async function fetchWithAuth(url: string, accessToken: string) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`TikTok API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export async function fetchTikTokUserInfo(
  username: string
): Promise<TikTokCreatorData | null> {
  const apiKey = process.env.TIKTOK_API_KEY

  if (!apiKey) {
    console.warn("TikTok API key not configured, using mock data for development")
    return getMockTikTokData(username)
  }

  try {
    // Fetch user info via TikTok Research API
    const userResponse = await fetch(`${TIKTOK_API_BASE}/research/user/info/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        fields: [
          "display_name",
          "follower_count",
          "following_count",
          "likes_count",
          "video_count",
          "bio_description",
          "avatar_url",
        ],
      }),
    })

    if (!userResponse.ok) {
      console.error("Failed to fetch TikTok user info:", userResponse.statusText)
      return null
    }

    const userData = await userResponse.json()
    const user = userData.data

    // Fetch recent videos to calculate engagement metrics
    const videosResponse = await fetch(`${TIKTOK_API_BASE}/research/video/query/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: { and: [{ field_name: "username", field_values: [username] }] },
        max_count: 20,
        fields: ["view_count", "like_count", "comment_count", "share_count"],
      }),
    })

    let videoMetrics: TikTokVideoMetrics = {
      avgViews: 0,
      avgLikes: 0,
      avgComments: 0,
      avgShares: 0,
      engagementRate: 0,
    }

    if (videosResponse.ok) {
      const videosData = await videosResponse.json()
      const videos = videosData.data?.videos || []

      if (videos.length > 0) {
        const totals = videos.reduce(
          (acc: { views: number; likes: number; comments: number; shares: number }, v: { view_count: number; like_count: number; comment_count: number; share_count: number }) => ({
            views: acc.views + (v.view_count || 0),
            likes: acc.likes + (v.like_count || 0),
            comments: acc.comments + (v.comment_count || 0),
            shares: acc.shares + (v.share_count || 0),
          }),
          { views: 0, likes: 0, comments: 0, shares: 0 }
        )

        const count = videos.length
        videoMetrics = {
          avgViews: Math.round(totals.views / count),
          avgLikes: Math.round(totals.likes / count),
          avgComments: Math.round(totals.comments / count),
          avgShares: Math.round(totals.shares / count),
          engagementRate:
            totals.views > 0
              ? ((totals.likes + totals.comments + totals.shares) / totals.views) * 100
              : 0,
        }
      }
    }

    return {
      userInfo: {
        tiktokId: user.id || username,
        username,
        displayName: user.display_name || username,
        followerCount: user.follower_count || 0,
        followingCount: user.following_count || 0,
        totalLikes: user.likes_count || 0,
        totalVideos: user.video_count || 0,
        bio: user.bio_description || "",
        avatar: user.avatar_url || "",
      },
      videoMetrics,
    }
  } catch (error) {
    console.error("Error fetching TikTok data:", error)
    return null
  }
}

// Mock data for development when TikTok API key is not available
function getMockTikTokData(username: string): TikTokCreatorData {
  const hash = username.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)

  return {
    userInfo: {
      tiktokId: `mock_${username}`,
      username,
      displayName: username,
      followerCount: (hash * 1000) % 1_000_000 + 1000,
      followingCount: (hash * 10) % 5000,
      totalLikes: (hash * 5000) % 10_000_000,
      totalVideos: (hash * 3) % 500 + 10,
      bio: `TikTok creator @${username}`,
      avatar: "",
    },
    videoMetrics: {
      avgViews: (hash * 100) % 500_000 + 1000,
      avgLikes: (hash * 10) % 50_000 + 100,
      avgComments: (hash * 2) % 5_000 + 10,
      avgShares: hash % 1_000 + 5,
      engagementRate: (hash % 15) + 1,
    },
  }
}
