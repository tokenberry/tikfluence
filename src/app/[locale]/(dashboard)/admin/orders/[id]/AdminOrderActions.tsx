"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function AdminOrderActions({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState("");
  const [confirmAction, setConfirmAction] = useState<"complete" | "cancel" | null>(null);

  async function forceComplete() {
    setConfirmAction(null);
    setLoading("complete");
    try {
      const res = await fetch(`/api/orders/${orderId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: true }),
      });
      if (res.ok) {
        toast("success", "Order marked as completed.");
        router.refresh();
      } else {
        const data = await res.json();
        toast("error", data.error ?? "Failed to complete order.");
      }
    } catch {
      toast("error", "An error occurred.");
    } finally {
      setLoading("");
    }
  }

  async function forceCancel() {
    setConfirmAction(null);
    setLoading("cancel");
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast("success", "Order cancelled.");
        router.refresh();
      } else {
        const data = await res.json();
        toast("error", data.error ?? "Failed to cancel order.");
      }
    } catch {
      toast("error", "An error occurred.");
    } finally {
      setLoading("");
    }
  }

  if (["COMPLETED", "CANCELLED"].includes(status)) return null;

  return (
    <>
      <div className="flex gap-3">
        {status === "DELIVERED" && (
          <button
            onClick={() => setConfirmAction("complete")}
            disabled={!!loading}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {loading === "complete" ? "Completing..." : "Force Complete"}
          </button>
        )}
        <button
          onClick={() => setConfirmAction("cancel")}
          disabled={!!loading}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {loading === "cancel" ? "Cancelling..." : "Cancel Order"}
        </button>
      </div>

      <ConfirmDialog
        open={confirmAction === "complete"}
        title="Force Complete Order"
        description="This will mark the order as COMPLETED. Are you sure?"
        confirmLabel="Force Complete"
        confirmVariant="primary"
        onConfirm={forceComplete}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmDialog
        open={confirmAction === "cancel"}
        title="Cancel Order"
        description="This action cannot be undone. The order will be permanently cancelled."
        confirmLabel="Cancel Order"
        confirmVariant="danger"
        onConfirm={forceCancel}
        onCancel={() => setConfirmAction(null)}
      />
    </>
  );
}
