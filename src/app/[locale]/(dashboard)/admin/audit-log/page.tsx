"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
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
import { ScrollText } from "lucide-react";

interface AuditEntry {
  id: string;
  actorUserId: string | null;
  actorEmail: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: unknown;
  createdAt: string;
  actorUser: { id: string; name: string; email: string } | null;
}

const TARGET_TYPES = [
  "",
  "USER",
  "ORDER",
  "SETTINGS",
  "AGENCY_BRAND",
  "BULK",
] as const;

export default function AdminAuditLogPage() {
  const t = useTranslations("admin");
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [targetFilter, setTargetFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter.trim()) params.set("action", actionFilter.trim());
      if (targetFilter) params.set("targetType", targetFilter);
      params.set("page", String(page));
      params.set("limit", "25");
      const res = await fetch(`/api/admin/audit-log?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries ?? []);
        if (data.pagination) {
          setPagination({
            total: data.pagination.total,
            totalPages: data.pagination.totalPages,
          });
        }
      } else {
        toast.error("Failed to load audit log.");
      }
    } catch {
      toast.error("Failed to load audit log.");
    } finally {
      setLoading(false);
    }
  }, [actionFilter, targetFilter, page]);

  useEffect(() => {
    const timeout = setTimeout(fetchEntries, 300);
    return () => clearTimeout(timeout);
  }, [fetchEntries]);

  const targetLabel = (type: string) => {
    switch (type) {
      case "USER":
        return t("audit_log_target_user");
      case "ORDER":
        return t("audit_log_target_order");
      case "SETTINGS":
        return t("audit_log_target_settings");
      case "AGENCY_BRAND":
        return t("audit_log_target_agency_brand");
      case "BULK":
        return t("audit_log_target_bulk");
      default:
        return type;
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-3 sm:p-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {t("audit_log_title")}
        </h1>
        <p className="mt-1 text-sm text-gray-500">{t("audit_log_desc")}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <input
          type="text"
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          placeholder={t("audit_log_filter_action")}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#d4772c] focus:outline-none focus:ring-1 focus:ring-[#d4772c]"
        />
        <select
          value={targetFilter}
          onChange={(e) => {
            setTargetFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#d4772c] focus:outline-none focus:ring-1 focus:ring-[#d4772c]"
        >
          {TARGET_TYPES.map((type) =>
            type === "" ? (
              <option key="all" value="">
                {t("audit_log_filter_target")}
              </option>
            ) : (
              <option key={type} value={type}>
                {targetLabel(type)}
              </option>
            )
          )}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <LoadingSpinner message="Loading audit entries..." />
        ) : entries.length === 0 ? (
          <EmptyState
            title={t("audit_log_empty_title")}
            description={t("audit_log_empty_desc")}
            icon={<ScrollText className="h-6 w-6" />}
          />
        ) : (
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead className="px-6">{t("audit_log_col_time")}</TableHead>
                <TableHead className="px-6">{t("audit_log_col_actor")}</TableHead>
                <TableHead className="px-6">{t("audit_log_col_action")}</TableHead>
                <TableHead className="px-6">{t("audit_log_col_target")}</TableHead>
                <TableHead className="px-6">{t("audit_log_col_detail")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="px-6 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(entry.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="px-6">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">
                        {entry.actorUser?.name ?? entry.actorEmail}
                      </span>
                      <span className="text-xs text-gray-500">
                        {entry.actorEmail}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6">
                    <code className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-800">
                      {entry.action}
                    </code>
                  </TableCell>
                  <TableCell className="px-6">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-700">
                        {targetLabel(entry.targetType)}
                      </span>
                      {entry.targetId && (
                        <span className="text-xs text-gray-500 font-mono truncate max-w-[14rem]">
                          {entry.targetId}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 max-w-md">
                    {entry.metadata ? (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-[#d4772c] hover:underline">
                          view
                        </summary>
                        <pre className="mt-2 overflow-x-auto rounded bg-gray-50 p-2 text-[11px] text-gray-700">
                          {JSON.stringify(entry.metadata, null, 2)}
                        </pre>
                      </details>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
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
        limit={25}
        onPageChange={setPage}
      />
    </div>
  );
}
