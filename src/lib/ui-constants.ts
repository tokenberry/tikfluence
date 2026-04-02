// Shared color/label constants — single source of truth for all UI mappings

export const ORDER_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  OPEN: "bg-blue-100 text-blue-700",
  ASSIGNED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  DELIVERED: "bg-yellow-100 text-yellow-700",
  REVISION: "bg-orange-100 text-orange-700",
  APPROVED: "bg-green-100 text-green-700",
  COMPLETED: "bg-green-100 text-green-700",
  DISPUTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-700",
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  OPEN: "Open",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  DELIVERED: "Delivered",
  REVISION: "Revision",
  APPROVED: "Approved",
  COMPLETED: "Completed",
  DISPUTED: "Disputed",
  CANCELLED: "Cancelled",
}

export const TIER_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Bronze", color: "bg-amber-700 text-white" },
  2: { label: "Silver", color: "bg-gray-400 text-white" },
  3: { label: "Gold", color: "bg-yellow-500 text-white" },
  4: { label: "Platinum", color: "bg-cyan-400 text-gray-900" },
  5: { label: "Diamond", color: "bg-purple-500 text-white" },
}

export const ROLE_COLORS: Record<string, string> = {
  CREATOR: "bg-purple-100 text-purple-700",
  NETWORK: "bg-blue-100 text-blue-700",
  BRAND: "bg-green-100 text-green-700",
  ADMIN: "bg-red-100 text-red-700",
  AGENCY: "bg-orange-100 text-orange-700",
  ACCOUNT_MANAGER: "bg-cyan-100 text-cyan-700",
}

export const ROLE_LABELS: Record<string, string> = {
  CREATOR: "Creator",
  NETWORK: "Network",
  BRAND: "Brand",
  ADMIN: "Admin",
  AGENCY: "Agency",
  ACCOUNT_MANAGER: "Account Manager",
}

export const ORDER_TYPE_COLORS: Record<string, string> = {
  SHORT_VIDEO: "bg-blue-100 text-blue-700",
  LIVE: "bg-red-100 text-red-700",
  COMBO: "bg-purple-100 text-purple-700",
}

export const ORDER_TYPE_LABELS: Record<string, string> = {
  SHORT_VIDEO: "Short Video",
  LIVE: "LIVE",
  COMBO: "Combo",
}

export const TICKET_STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-yellow-100 text-yellow-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  RESOLVED: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-100 text-gray-700",
}

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  HELD: "bg-blue-100 text-blue-700",
  RELEASED: "bg-green-100 text-green-700",
  REFUNDED: "bg-gray-100 text-gray-700",
  FAILED: "bg-red-100 text-red-700",
}
