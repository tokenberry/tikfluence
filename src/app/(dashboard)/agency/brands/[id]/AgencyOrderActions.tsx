"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AgencyOrderActions({
  orderId,
  status,
  budget,
}: {
  orderId: string;
  status: string;
  budget: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [creditBalance, setCreditBalance] = useState(0);

  useEffect(() => {
    fetch("/api/brand/credits")
      .then((r) => r.ok ? r.json() : { balance: 0 })
      .then((data) => setCreditBalance(data.balance ?? 0))
      .catch(() => {});
  }, []);

  const creditToApply = Math.min(Math.max(creditBalance, 0), budget);
  const amountToCharge = budget - creditToApply;

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to start checkout");
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      // Fully covered by credit or dev mode — order is now OPEN
      router.refresh();
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
      <div className="space-y-3">
        {creditBalance > 0 && (
          <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm">
            <p className="font-medium text-green-800">
              Brand has ${creditBalance.toFixed(2)} in platform credit
            </p>
            {creditToApply > 0 && amountToCharge > 0 && (
              <p className="text-green-700 mt-1">
                ${creditToApply.toFixed(2)} credit will be applied. Charge: ${amountToCharge.toFixed(2)}.
              </p>
            )}
            {amountToCharge <= 0 && (
              <p className="text-green-700 mt-1">
                This order is fully covered by credit balance!
              </p>
            )}
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="rounded-md bg-[#d4772c] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#b85c1a] transition-colors disabled:opacity-50"
          >
            {loading
              ? "Processing..."
              : amountToCharge <= 0
                ? "Publish Order (Using Credit)"
                : `Pay $${amountToCharge.toFixed(2)} & Publish`}
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (status === "OPEN" || status === "ASSIGNED" || status === "IN_PROGRESS") {
    return (
      <button
        onClick={handleCancel}
        disabled={loading}
        className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        {loading ? "Cancelling..." : "Cancel Order"}
      </button>
    );
  }

  return null;
}
