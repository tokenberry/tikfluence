"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
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
        // Prune selection to ids still visible on the current page so
        // "Select all" + bulk actions don't include rows we no longer
        // render.
        setSelected((prev) => {
          const visibleIds = new Set<string>(
            (data.users ?? []).map((u: UserRow) => u.id)
          );
          const next = new Set<string>();
          for (const id of prev) if (visibleIds.has(id)) next.add(id);
          return next;
        });
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

  const allSelected = useMemo(
    () => users.length > 0 && users.every((u) => selected.has(u.id)),
    [users, selected]
  );

  function toggleOne(userId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      if (users.every((u) => prev.has(u.id))) {
        // All visible rows are selected — clear them from the selection.
        const next = new Set(prev);
        for (const u of users) next.delete(u.id);
        return next;
      }
      // Otherwise add all visible rows.
      const next = new Set(prev);
      for (const u of users) next.add(u.id);
      return next;
    });
  }

  async function bulkUpdate(action: "suspend" | "activate") {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      const res = await fetch(`/api/admin/users/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userIds: Array.from(selected) }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(t("users_bulk_success", { count: data.updated }));
        setSelected(new Set());
        await fetchUsers();
      } else {
        toast.error(t("users_bulk_error"));
      }
    } catch {
      toast.error(t("users_bulk_error"));
    } finally {
      setBulkLoading(false);
    }
  }

  async function toggleStatus(userId: string, isActive: boolean) {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isActive: !isActive }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isActive: !isActive } : u))
        );
        toast.success(isActive ? t("users_suspend_success") : t("users_activate_success"));
      } else {
        toast.error("Failed to update user status.");
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

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#d4772c]/30 bg-[#fdf6e3] px-4 py-3">
          <span className="text-sm font-medium text-gray-900">
            {t("users_bulk_selected", { count: selected.size })}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => bulkUpdate("activate")}
              disabled={bulkLoading}
              className="rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {t("users_bulk_activate")}
            </button>
            <button
              onClick={() => bulkUpdate("suspend")}
              disabled={bulkLoading}
              className="rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {t("users_bulk_suspend")}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <LoadingSpinner message="Loading users..." />
        ) : users.length === 0 ? (
          <EmptyState title={t("users_empty_title")} description={t("users_empty_desc")} icon={<Users className="h-6 w-6" />} />
        ) : (
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 px-6">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label={t("users_select_all")}
                    className="h-4 w-4 rounded border-gray-300 text-[#d4772c] focus:ring-[#d4772c]"
                  />
                </TableHead>
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
                <TableRow key={user.id} data-state={selected.has(user.id) ? "selected" : undefined}>
                  <TableCell className="px-6">
                    <input
                      type="checkbox"
                      checked={selected.has(user.id)}
                      onChange={() => toggleOne(user.id)}
                      aria-label={`Select ${user.email}`}
                      className="h-4 w-4 rounded border-gray-300 text-[#d4772c] focus:ring-[#d4772c]"
                    />
                  </TableCell>
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
