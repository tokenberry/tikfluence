"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { RoleBadge } from "@/components/ui/Badge";
import { toast } from "sonner";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import { DataPagination } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users } from "lucide-react";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const t = useTranslations("admin");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      params.set("page", String(page));
      params.set("limit", "20");
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users ?? []);
        if (data.pagination) {
          setPagination({ total: data.pagination.total, totalPages: data.pagination.totalPages });
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, page]);

  useEffect(() => {
    const timeout = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timeout);
  }, [fetchUsers]);

  async function toggleStatus(userId: string, isActive: boolean) {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isActive: !isActive } : u))
        );
      }
    } catch {
      toast.error("Failed to update user status.");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-3 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t("users_title")}</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder={t("users_search")}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#d4772c] focus:outline-none focus:ring-1 focus:ring-[#d4772c]"
        />
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#d4772c] focus:outline-none focus:ring-1 focus:ring-[#d4772c]"
        >
          <option value="">{t("users_filter_all")}</option>
          <option value="CREATOR">Creator</option>
          <option value="NETWORK">Network</option>
          <option value="BRAND">Brand</option>
          <option value="ADMIN">Admin</option>
          <option value="AGENCY">Agency</option>
          <option value="ACCOUNT_MANAGER">Account Manager</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <LoadingSpinner message="Loading users..." />
        ) : users.length === 0 ? (
          <EmptyState title={t("users_empty_title")} description={t("users_empty_desc")} icon={<Users className="h-6 w-6" />} />
        ) : (
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow>
                <TableHead className="px-6">{t("users_table_name")}</TableHead>
                <TableHead className="px-6">{t("users_table_email")}</TableHead>
                <TableHead className="px-6">{t("users_table_role")}</TableHead>
                <TableHead className="px-6">{t("users_table_status")}</TableHead>
                <TableHead className="px-6">{t("users_table_created")}</TableHead>
                <TableHead className="px-6">{t("users_table_actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="px-6 font-medium text-gray-900">{user.name}</TableCell>
                  <TableCell className="px-6 text-gray-600">{user.email}</TableCell>
                  <TableCell className="px-6">
                    <RoleBadge role={user.role ?? "NONE"} />
                  </TableCell>
                  <TableCell className="px-6">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        user.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {user.isActive ? t("users_active") : t("users_suspended")}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="px-6">
                    <button
                      onClick={() => toggleStatus(user.id, user.isActive)}
                      disabled={actionLoading === user.id}
                      className={`rounded px-3 py-1 text-xs font-medium text-white disabled:opacity-50 ${
                        user.isActive
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      {actionLoading === user.id
                        ? "..."
                        : user.isActive
                        ? t("users_suspend")
                        : t("users_activate")}
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <DataPagination
        page={page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        limit={20}
        onPageChange={setPage}
      />
    </div>
  );
}
