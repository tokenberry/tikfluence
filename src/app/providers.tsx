"use client"

import { SessionProvider } from "next-auth/react"
import { Toaster } from "@/components/ui/sonner"
import { WebVitalsReporter } from "@/components/web-vitals-reporter"

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <WebVitalsReporter />
      {children}
      <Toaster />
    </SessionProvider>
  )
}
