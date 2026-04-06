"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts"

interface OrderTrend {
  month: string
  orders: number
}

interface RevenueTrend {
  month: string
  revenue: number
  fees: number
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#9ca3af",
  OPEN: "#3b82f6",
  ASSIGNED: "#6366f1",
  IN_PROGRESS: "#8b5cf6",
  DELIVERED: "#eab308",
  REVISION: "#f97316",
  APPROVED: "#22c55e",
  COMPLETED: "#10b981",
  DISPUTED: "#ef4444",
  CANCELLED: "#6b7280",
}

const ROLE_COLORS: Record<string, string> = {
  CREATOR: "#8b5cf6",
  NETWORK: "#3b82f6",
  BRAND: "#22c55e",
  ADMIN: "#ef4444",
}

function formatMonth(month: string) {
  const [year, m] = month.split("-")
  const date = new Date(parseInt(year), parseInt(m) - 1)
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
}

export function OrderStatusChart({ data }: { data: Record<string, number> }) {
  const chartData = Object.entries(data)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      name: status.replace("_", " "),
      value: count,
      fill: STATUS_COLORS[status] || "#9ca3af",
    }))

  if (chartData.length === 0) {
    return <p className="text-center text-sm text-gray-500 py-8">No order data yet.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          label={({ name, value }) => `${name} (${value})`}
        >
          {chartData.map((entry, index) => (
            <Cell key={index} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function UserRoleChart({ data }: { data: Record<string, number> }) {
  const chartData = Object.entries(data).map(([role, count]) => ({
    name: role.charAt(0) + role.slice(1).toLowerCase(),
    count,
    fill: ROLE_COLORS[role] || "#9ca3af",
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="count" name="Users">
          {chartData.map((entry, index) => (
            <Cell key={index} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function OrderTrendChart({ data }: { data: OrderTrend[] }) {
  const chartData = data.map((d) => ({
    ...d,
    month: formatMonth(d.month),
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="orders" name="Orders" fill="#d4772c" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function RevenueTrendChart({ data }: { data: RevenueTrend[] }) {
  const chartData = data.map((d) => ({
    ...d,
    month: formatMonth(d.month),
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
        <Legend />
        <Area
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke="#22c55e"
          fill="#22c55e"
          fillOpacity={0.1}
        />
        <Area
          type="monotone"
          dataKey="fees"
          name="Platform Fees"
          stroke="#d4772c"
          fill="#d4772c"
          fillOpacity={0.1}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
