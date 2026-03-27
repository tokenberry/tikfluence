"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OrderActions({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handlePublish = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "OPEN" }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to publish order");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to cancel order");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (status === "DRAFT") {
    return (
      <div className="flex gap-3">
        <button
          onClick={handlePublish}
          disabled={loading}
          className="rounded-md bg-[#d4772c] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#b85c1a] transition-colors disabled:opacity-50"
        >
          {loading ? "Publishing..." : "Publish Order"}
        </button>
        <button
          onClick={handleCancel}
          disabled={loading}
          className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (status === "OPEN") {
    return (
      <button
        onClick={handleCancel}
        disabled={loading}
        className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        {loading ? "Cancelling..." : "Cancel Order"}
      </button>
    );
  }

  return null;
}
