import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  ShoppingBag,
  CheckCircle,
  DollarSign,
  Briefcase,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CreatorDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id },
  });

  if (!creator) redirect("/creator/profile");

  const [activeOrders, completedOrders, earningsAgg, availableOrders] =
    await Promise.all([
      prisma.orderAssignment.count({
        where: {
          creatorId: creator.id,
          order: {
            status: { in: ["ASSIGNED", "IN_PROGRESS", "DELIVERED"] },
          },
        },
      }),
      prisma.orderAssignment.count({
        where: {
          creatorId: creator.id,
          order: { status: "COMPLETED" },
        },
      }),
      prisma.transaction.aggregate({
        where: {
          order: {
            assignments: { some: { creatorId: creator.id } },
          },
          status: "RELEASED",
        },
        _sum: { creatorPayout: true },
      }),
      prisma.order.count({
        where: { status: "OPEN" },
      }),
    ]);

  const totalEarnings = earningsAgg._sum.creatorPayout ?? 0;

  const stats = [
    {
      label: "Active Orders",
      value: formatNumber(activeOrders),
      icon: ShoppingBag,
      accent: "text-[#d4772c]",
      bg: "bg-orange-50",
    },
    {
      label: "Completed Orders",
      value: formatNumber(completedOrders),
      icon: CheckCircle,
      accent: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Total Earnings",
      value: formatCurrency(totalEarnings),
      icon: DollarSign,
      accent: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Available Orders",
      value: formatNumber(availableOrders),
      icon: Briefcase,
      accent: "text-blue-600",
      bg: "bg-blue-50",
    },
  ];

  const quickActions = [
    {
      label: "View Orders",
      href: "/creator/orders",
      description: "Manage your active and past orders",
    },
    {
      label: "Browse Available",
      href: "/creator/orders?tab=available",
      description: "Find new orders to work on",
    },
    {
      label: "My Profile",
      href: "/creator/profile",
      description: "Update your creator profile",
    },
    {
      label: "Submit Ticket",
      href: "/creator/tickets/new",
      description: "Get help from the support team",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session.user.name ?? "Creator"}
        </h1>
        <p className="mt-1 text-gray-500">
          Here&apos;s an overview of your creator activity.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-lg ${stat.bg} p-2.5`}>
                <stat.icon className={`h-5 w-5 ${stat.accent}`} />
              </div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            </div>
            <p className="mt-3 text-2xl font-bold text-gray-900">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="group rounded-lg border border-gray-200 bg-[#fdf6e3] p-5 shadow-sm transition-colors hover:border-[#d4772c]/40 hover:bg-[#fdf6e3]/80"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">
                  {action.label}
                </span>
                <ArrowRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#d4772c]" />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {action.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
