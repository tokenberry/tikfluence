import { formatNumber, formatCurrency } from "@/lib/utils"
import VerifiedBadge from "@/components/VerifiedBadge"
import { TierBadge } from "@/components/ui/Badge"

export type CreatorCardCreator = {
  id: string
  tiktokUsername: string
  followerCount: number
  avgViews: number
  score: number
  tier: number
  pricePerThousand: number
  tiktokVerified?: boolean
  supportsLive: boolean
  supportsShortVideo: boolean
  user: { name: string }
  categories: Array<{ category: { name: string } }>
}

export type CreatorCardLabels = {
  followers: string
  avgViews: string
  score: string
  badgeVideo: string
  badgeLive: string
}

type CreatorCardProps = {
  creator: CreatorCardCreator
  href: string
  showVerifiedBadge?: boolean
  labels: CreatorCardLabels
}

/**
 * Browse-variant creator card. Used on pages where brands/agencies
 * shop for creators (`/brand/browse`, `/agency/browse`). Renders a
 * clickable card with avatar initial, tier, follower/view/score stats,
 * supported content-type badges, and a category + price footer.
 *
 * Not used for the "managed creators" pages (`/network/creators`,
 * `/agency/creators`) — those have a different layout (engagement %,
 * payoneer status) and are intentionally kept separate.
 */
export default function CreatorCard({
  creator,
  href,
  showVerifiedBadge = false,
  labels,
}: CreatorCardProps) {
  return (
    <a
      href={href}
      className="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-lg font-bold text-[#d4772c]">
          {creator.user.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{creator.user.name}</h3>
          <p className="flex items-center gap-1 text-sm text-gray-500">
            @{creator.tiktokUsername}
            {showVerifiedBadge && (
              <VerifiedBadge verified={creator.tiktokVerified ?? false} />
            )}
          </p>
        </div>
        <TierBadge tier={creator.tier} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-lg font-bold text-gray-900">
            {formatNumber(creator.followerCount)}
          </p>
          <p className="text-xs text-gray-500">{labels.followers}</p>
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900">
            {formatNumber(creator.avgViews)}
          </p>
          <p className="text-xs text-gray-500">{labels.avgViews}</p>
        </div>
        <div>
          <p className="text-lg font-bold text-[#d4772c]">
            {creator.score.toFixed(1)}
          </p>
          <p className="text-xs text-gray-500">{labels.score}</p>
        </div>
      </div>

      <div className="mt-3 flex gap-1">
        {creator.supportsShortVideo && (
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            {labels.badgeVideo}
          </span>
        )}
        {creator.supportsLive && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
            {labels.badgeLive}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-3">
        <div className="flex flex-wrap gap-1">
          {creator.categories.slice(0, 2).map(({ category }, i) => (
            <span
              key={i}
              className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
            >
              {category.name}
            </span>
          ))}
        </div>
        <span className="text-sm font-semibold text-gray-900">
          {formatCurrency(creator.pricePerThousand)}/1K
        </span>
      </div>
    </a>
  )
}
