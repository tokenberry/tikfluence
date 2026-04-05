import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign Up",
  description:
    "Create your Foxolog account — join the TikTok influencer marketplace as a Brand, Creator, Network, or Agency. Start running campaigns or monetizing your content today.",
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}
