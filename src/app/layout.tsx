import type { Metadata } from "next"
import "./globals.css"

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.foxolog.com"
const SITE_NAME = "Foxolog"
const SITE_DESCRIPTION =
  "The TikTok influencer marketplace connecting brands of all sizes with creators. Browse AI-scored creators, run short video & LIVE stream campaigns, and pay securely with escrow — no middlemen needed."

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Foxolog — TikTok Influencer Marketplace for Brands & Creators",
    template: "%s | Foxolog",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "TikTok influencer marketplace",
    "TikTok creator platform",
    "influencer marketing platform",
    "hire TikTok creators",
    "TikTok brand deals",
    "TikTok LIVE sponsorship",
    "influencer marketing for small business",
    "creator monetization",
    "TikTok campaign management",
    "influencer discovery tool",
    "micro influencer marketplace",
    "TikTok advertising alternatives",
    "brand creator collaboration",
    "TikTok content marketing",
    "influencer escrow payments",
    "AI creator scoring",
    "TikTok marketing platform",
    "creator economy platform",
    "SMB influencer marketing",
    "Foxolog",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Foxolog — TikTok Influencer Marketplace for Brands & Creators",
    description: SITE_DESCRIPTION,
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Foxolog — TikTok Influencer Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Foxolog — TikTok Influencer Marketplace",
    description: SITE_DESCRIPTION,
    images: [`${SITE_URL}/og-image.png`],
  },
  alternates: {
    canonical: SITE_URL,
  },
  category: "technology",
}

// JSON-LD structured data
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/fox-logo.png`,
      },
      description: SITE_DESCRIPTION,
      sameAs: [],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      publisher: { "@id": `${SITE_URL}/#organization` },
      description: SITE_DESCRIPTION,
    },
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#app`,
      name: SITE_NAME,
      url: SITE_URL,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Free to sign up. Platform fees apply on transactions.",
      },
      description:
        "Self-serve influencer marketplace for TikTok. Brands browse AI-scored creators, create campaigns (Short Video, LIVE Stream, Combo), and pay securely via escrow. Creators monetize their content with direct brand partnerships.",
      featureList: [
        "AI-powered creator scoring",
        "TikTok OAuth verification",
        "Escrow payments via Stripe",
        "Global payouts via Payoneer",
        "Short Video, LIVE Stream, and Combo campaigns",
        "AI delivery analysis",
        "Multi-role platform (Brand, Creator, Network, Agency)",
      ],
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        {children}
      </body>
    </html>
  )
}
