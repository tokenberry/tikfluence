import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Log In",
  description:
    "Log in to Foxolog — the TikTok influencer marketplace. Manage your campaigns, track deliveries, and grow your brand or creator business.",
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
