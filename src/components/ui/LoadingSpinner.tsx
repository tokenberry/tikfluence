"use client"

import { Loader2 } from "lucide-react"

export default function LoadingSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-gray-400">
      <Loader2 className="h-6 w-6 animate-spin" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
