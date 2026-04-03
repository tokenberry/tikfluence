"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

export default function AcceptOrderButton({
  orderId,
  creatorId,
}: {
  orderId: string;
  creatorId: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleAccept() {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorId }),
      });
      if (res.ok) {
        toast("success", "Order accepted!");
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        toast("error", data?.error || "Failed to accept order.");
      }
    } catch {
      toast("error", "An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleAccept}
      disabled={loading}
      className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
    >
      {loading ? "Accepting..." : "Accept Order"}
    </button>
  );
}
