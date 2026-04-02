import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  TIER_LABELS,
  ROLE_COLORS,
  ROLE_LABELS,
  ORDER_TYPE_COLORS,
  ORDER_TYPE_LABELS,
  TICKET_STATUS_COLORS,
  PAYMENT_STATUS_COLORS,
} from "@/lib/ui-constants"

interface BadgeProps {
  className?: string
}

export function StatusBadge({ status }: { status: string } & BadgeProps) {
  const colors = ORDER_STATUS_COLORS[status] ?? "bg-gray-100 text-gray-700"
  const label =
    ORDER_STATUS_LABELS[status] ?? status.replace(/_/g, " ")
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colors}`}
    >
      {label}
    </span>
  )
}

export function TierBadge({ tier }: { tier: number } & BadgeProps) {
  const config = TIER_LABELS[tier] ?? TIER_LABELS[1]
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.color}`}
    >
      {config.label}
    </span>
  )
}

export function RoleBadge({ role }: { role: string } & BadgeProps) {
  const colors = ROLE_COLORS[role] ?? "bg-gray-100 text-gray-700"
  const label = ROLE_LABELS[role] ?? role.replace(/_/g, " ")
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colors}`}
    >
      {label}
    </span>
  )
}

export function OrderTypeBadge({ type }: { type: string } & BadgeProps) {
  const colors = ORDER_TYPE_COLORS[type] ?? "bg-gray-100 text-gray-700"
  const label = ORDER_TYPE_LABELS[type] ?? type.replace(/_/g, " ")
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colors}`}
    >
      {label}
    </span>
  )
}

export function TicketStatusBadge({ status }: { status: string } & BadgeProps) {
  const colors = TICKET_STATUS_COLORS[status] ?? "bg-gray-100 text-gray-700"
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colors}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  )
}

export function PaymentStatusBadge({ status }: { status: string } & BadgeProps) {
  const colors = PAYMENT_STATUS_COLORS[status] ?? "bg-gray-100 text-gray-700"
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colors}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  )
}
