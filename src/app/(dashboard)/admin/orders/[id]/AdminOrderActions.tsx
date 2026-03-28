"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminOrderActions({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState("");

  async function forceComplete() {
    if (!confirm("Force-complete this order? This will mark it as COMPLETED.")) return;
    setLoading("complete");
    try {
      const res = await fetch(`/api/orders/${orderId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: true }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error ?? "Failed to complete order.");
      }
    } catch {
      alert("An error occurred.");
    } finally {
      setLoading("");
    }
  }

  async function forceCancel() {
    if (!confirm("Cancel this order? This action cannot be undone.")) return;
    setLoading("cancel");
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error ?? "Failed to cancel order.");
      }
    } catch {
      alert("An error occurred.");
    } finally {
      setLoading("");
    }
  }

  if (["COMPLETED", "CANCELLED"].includes(status)) return null;

  return (
    <div className="flex gap-3">
      {status === "DELIVERED" && (
        <button
          onClick={forceComplete}
          disabled={!!loading}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {loading === "complete" ? "Completing..." : "Force Complete"}
        </button>
      )}
      <button
        onClick={forceCancel}
        disabled={!!loading}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        {loading === "cancel" ? "Cancelling..." : "Cancel Order"}
      </button>
    </div>
  );
}
