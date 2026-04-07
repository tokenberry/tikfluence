"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/Badge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText } from "lucide-react";

interface OrderRow {
  id: string;
  title: string;
  status: string;
  budget: number;
  createdAt: string;
  brand: { companyName: string };
}

const statuses = [
  "",
  "DRAFT",
  "OPEN",
  "ASSIGNED",
  "IN_PROGRESS",
  "DELIVERED",
  "APPROVED",
  "COMPLETED",
  "DISPUTED",
  "CANCELLED",
];

export default function AdminOrdersPage() {
  const t = useTranslations("admin");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-3 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t("orders_title")}</h1>

      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <button
            key={s || "ALL"}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition ${
              statusFilter === s
                ? "bg-[#d4772c] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {s || t("orders_filter_all")}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <LoadingSpinner message="Loading orders..." />
        ) : orders.length === 0 ? (
          <EmptyState title={t("orders_empty_title")} description={t("orders_empty_desc")} icon={<FileText className="h-6 w-6" />} />
        ) : (
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow>
                <TableHead className="px-6">Title</TableHead>
                <TableHead className="px-6">Brand</TableHead>
                <TableHead className="px-6">Status</TableHead>
                <TableHead className="px-6">Budget</TableHead>
                <TableHead className="px-6">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow
                  key={order.id}
                  className="cursor-pointer"
                  onClick={() => window.location.href = `/admin/orders/${order.id}`}
                >
                  <TableCell className="px-6 font-medium text-gray-900">{order.title}</TableCell>
                  <TableCell className="px-6 text-gray-600">{order.brand.companyName}</TableCell>
                  <TableCell className="px-6">
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="px-6 text-gray-600">{formatCurrency(order.budget)}</TableCell>
                  <TableCell className="px-6 text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
