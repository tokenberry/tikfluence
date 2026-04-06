import type { MetadataRoute } from "next"

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.foxolog.com"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
  ]
}
