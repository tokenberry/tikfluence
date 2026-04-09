import { BadgeCheck } from "lucide-react"

interface VerifiedBadgeProps {
  verified: boolean
  size?: "sm" | "md"
  label?: string
}

export default function VerifiedBadge({ verified, size = "sm", label = "Verified" }: VerifiedBadgeProps) {
  if (!verified) return null

  const iconSize = size === "sm" ? 14 : 18
  const textClass = size === "sm" ? "text-xs" : "text-sm"

  return (
    <span className={`inline-flex items-center gap-0.5 font-medium text-emerald-600 ${textClass}`}>
      <BadgeCheck size={iconSize} />
      <span>{label}</span>
    </span>
  )
}
