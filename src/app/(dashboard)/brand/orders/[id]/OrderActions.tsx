"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function OrderActions({
  orderId,
  status,
  budget,
}: {
  orderId: string;
  status: string;
  budget: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [creditBalance, setCreditBalance] = useState(0);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

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
        toast("error", data.error || "Failed to start checkout");
        return;
      }

      if (data.checkoutUrl) {
        // Redirect to Stripe Checkout
        window.location.href = data.checkoutUrl;
        return;
      }

      // Fully covered by credit or dev mode — order is now OPEN
      router.refresh();
    } catch {
      toast("error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setShowCancelConfirm(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast("success", "Order cancelled.");
        router.refresh();
      } else {
        const data = await res.json();
        toast("error", data.error || "Failed to cancel order");
      }
    } catch {
      toast("error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (status === "DRAFT") {
    return (
      <>
        <div className="space-y-3">
          {creditBalance > 0 && (
            <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm">
              <p className="font-medium text-green-800">
                You have ${creditBalance.toFixed(2)} in platform credit
              </p>
              {creditToApply > 0 && amountToCharge > 0 && (
                <p className="text-green-700 mt-1">
                  ${creditToApply.toFixed(2)} credit will be applied. You&apos;ll pay ${amountToCharge.toFixed(2)}.
                </p>
              )}
              {amountToCharge <= 0 && (
                <p className="text-green-700 mt-1">
                  This order is fully covered by your credit balance!
                </p>
              )}
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="rounded-md bg-[#d4772c] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#b85c1a] transition-colors disabled:opacity-50"
            >
              {loading
                ? "Processing..."
                : amountToCharge <= 0
                  ? "Publish Order (Using Credit)"
                  : `Pay $${amountToCharge.toFixed(2)} & Publish`}
            </button>
            <button
              onClick={() => setShowCancelConfirm(true)}
              disabled={loading}
              className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
        <ConfirmDialog
          open={showCancelConfirm}
          title="Cancel Order"
          description="Are you sure you want to cancel this order? This action cannot be undone."
          confirmLabel="Cancel Order"
          confirmVariant="danger"
          onConfirm={handleCancel}
          onCancel={() => setShowCancelConfirm(false)}
        />
      </>
    );
  }

  if (status === "OPEN" || status === "ASSIGNED" || status === "IN_PROGRESS") {
    return (
      <>
        <button
          onClick={() => setShowCancelConfirm(true)}
          disabled={loading}
          className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          {loading ? "Cancelling..." : "Cancel Order"}
        </button>
        <ConfirmDialog
          open={showCancelConfirm}
          title="Cancel Order"
          description="Are you sure you want to cancel this order? This action cannot be undone."
          confirmLabel="Cancel Order"
          confirmVariant="danger"
          onConfirm={handleCancel}
          onCancel={() => setShowCancelConfirm(false)}
        />
      </>
    );
  }

  return null;
}
