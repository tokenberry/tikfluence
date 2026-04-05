"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

export default function DeliveryActions({
  deliveryId,
  orderId,
}: {
  deliveryId: string;
  orderId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");

  async function handleApprove() {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/deliveries/${deliveryId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: true }),
      });
      if (res.ok) {
        toast("success", "Delivery approved.");
        router.refresh();
      } else {
        toast("error", "Failed to approve delivery.");
      }
    } catch {
      toast("error", "An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    if (!reason.trim()) {
      toast("error", "Please provide a rejection reason.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/deliveries/${deliveryId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: false, rejectionReason: reason }),
      });
      if (res.ok) {
        toast("info", "Delivery sent back for revision.");
        router.refresh();
      } else {
        toast("error", "Failed to reject delivery.");
      }
    } catch {
      toast("error", "An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  if (showReject) {
    return (
      <div className="flex flex-col items-end gap-2">
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Rejection reason..."
          rows={2}
          className="w-48 rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-[#d4772c] focus:outline-none focus:ring-1 focus:ring-[#d4772c]"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setShowReject(false)}
            className="rounded px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleReject}
            disabled={loading}
            className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            Confirm Reject
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleApprove}
        disabled={loading}
        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        Approve
      </button>
      <button
        onClick={() => setShowReject(true)}
        disabled={loading}
        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  );
}
