import type { Metadata } from "next"
import "./globals.css"
import Providers from "@/app/providers"
import Navbar from "@/components/layout/Navbar"

export const metadata: Metadata = {
  title: "Foxolog - TikTok Influencer Marketplace",
  description:
    "Connect brands with TikTok creators. Foxolog is the marketplace where brands find the perfect TikTok influencers for their campaigns and creators monetize their content.",
  icons: {
    icon: "/fox-logo.png",
    apple: "/fox-logo.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <Providers>
          <Navbar />
          <div className="flex-1">{children}</div>
        </Providers>
      </body>
    </html>
  )
}
