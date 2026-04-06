import type { MetadataRoute } from "next"

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.foxolog.com"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/creator/", "/brand/", "/network/", "/agency/", "/account-manager/", "/deck/", "/onboarding/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
