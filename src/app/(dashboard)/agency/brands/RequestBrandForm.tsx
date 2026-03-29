"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Brand {
  id: string;
  companyName: string;
  industry: string | null;
  user: { name: string | null };
}

export default function RequestBrandForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!open || search.length < 2) {
      setBrands([]);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(() => {
      fetch(`/api/brands?search=${encodeURIComponent(search)}`)
        .then((res) => res.json())
        .then((data) => setBrands(data.brands ?? []))
        .catch(() => setBrands([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, open]);

  async function handleRequest(brandId: string) {
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/agency/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Brand claim submitted! Awaiting admin approval." });
        setSearch("");
        setBrands([]);
        setTimeout(() => {
          setOpen(false);
          setMessage(null);
          router.refresh();
        }, 1500);
      } else {
        setMessage({ type: "error", text: data.error ?? "Failed to submit request." });
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred." });
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-[#d4772c] px-4 py-2 text-sm font-medium text-white hover:bg-[#b8632a]"
      >
        Request Brand
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm w-full max-w-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Request to Manage a Brand</h3>
        <button onClick={() => { setOpen(false); setMessage(null); }} className="text-gray-400 hover:text-gray-600 text-sm">
          Cancel
        </button>
      </div>

      {message && (
        <div className={`mb-3 rounded-lg px-3 py-2 text-sm ${
          message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
        }`}>
          {message.text}
        </div>
      )}

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search brands by name..."
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        autoFocus
      />

      {loading && <p className="mt-2 text-xs text-gray-400">Searching...</p>}

      {brands.length > 0 && (
        <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
          {brands.map((brand) => (
            <div key={brand.id} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-900">{brand.companyName}</p>
                <p className="text-xs text-gray-500">{brand.industry ?? "No industry"}</p>
              </div>
              <button
                onClick={() => handleRequest(brand.id)}
                disabled={submitting}
                className="rounded-lg bg-[#d4772c] px-3 py-1 text-xs font-medium text-white hover:bg-[#b8632a] disabled:opacity-50"
              >
                Request
              </button>
            </div>
          ))}
        </div>
      )}

      {!loading && search.length >= 2 && brands.length === 0 && (
        <p className="mt-2 text-xs text-gray-400">No brands found.</p>
      )}

      <p className="mt-2 text-xs text-gray-400">
        After requesting, an admin will review and approve your claim.
      </p>
    </div>
  );
}
