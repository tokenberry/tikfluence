import * as React from "react"
import { cn } from "@/lib/utils"

type OrderCardProps = {
  href?: string
  title: string
  badge?: React.ReactNode
  className?: string
  children?: React.ReactNode
}

/**
 * Slot-based layout component for card-layout order lists
 * (`/brand/orders`, `/network/orders`, creator "accepted" section).
 *
 * Shares the wrapper + header flex row (title + status/type badge).
 * Subtitle, metrics row, and footer are all passed as children so
 * each caller can keep its own label wording and i18n.
 *
 * Table-layout order lists (agency, account-manager, admin) already
 * use shadcn `Table` primitives and are not migrated onto this.
 *
 * Usage:
 *
 *   <OrderCard
 *     href={`/brand/orders/${order.id}`}
 *     title={order.title}
 *     badge={<StatusBadge status={order.status} />}
 *   >
 *     <OrderCardSubtitle>{order.category.name}</OrderCardSubtitle>
 *     <OrderCardMetrics>
 *       <span>Target: {formatNumber(order.impressionTarget)} impressions</span>
 *       <span>Budget: {formatCurrency(order.budget)}</span>
 *     </OrderCardMetrics>
 *     <OrderCardFooter>Created: {date}</OrderCardFooter>
 *   </OrderCard>
 */
export default function OrderCard({
  href,
  title,
  badge,
  className,
  children,
}: OrderCardProps) {
  const wrapperClass = cn(
    "block rounded-lg border border-gray-200 bg-white p-5 shadow-sm",
    href && "transition hover:shadow-md",
    className
  )

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {badge}
      </div>
      {children}
    </>
  )

  if (href) {
    return (
      <a href={href} className={wrapperClass}>
        {content}
      </a>
    )
  }

  return <div className={wrapperClass}>{content}</div>
}

export function OrderCardSubtitle({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("mt-1 text-sm text-gray-500", className)}
      {...props}
    />
  )
}

export function OrderCardMetrics({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "mt-3 flex flex-wrap gap-4 text-sm text-gray-600",
        className
      )}
      {...props}
    />
  )
}

export function OrderCardFooter({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("mt-2 text-xs text-gray-400", className)}
      {...props}
    />
  )
}
