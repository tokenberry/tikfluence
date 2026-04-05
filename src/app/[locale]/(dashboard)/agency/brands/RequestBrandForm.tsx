"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Brand {
  id: string;
  companyName: string;
  industry: string | null;
}

export default function RequestBrandForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Create form fields (shown when no results)
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open || search.length < 2) {
      setBrands([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(() => {
      fetch(`/api/brands?search=${encodeURIComponent(search)}`)
        .then((res) => res.json())
        .then((data) => {
          setBrands(data.brands ?? []);
          setSearched(true);
        })
        .catch(() => {
          setBrands([]);
          setSearched(true);
        })
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, open]);

  function reset() {
    setOpen(false);
    setSearch("");
    setBrands([]);
    setSearched(false);
    setMessage(null);
    setIndustry("");
    setWebsite("");
    setDescription("");
  }

  function handleSuccess(text: string) {
    setMessage({ type: "success", text });
    setTimeout(() => {
      reset();
      router.refresh();
    }, 1500);
  }

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
        handleSuccess("Brand claim submitted! Awaiting admin approval.");
      } else {
        setMessage({ type: "error", text: data.error ?? "Failed to submit request." });
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred." });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!search.trim()) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/agency/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          createBrand: true,
          companyName: search.trim(),
          industry: industry.trim() || undefined,
          website: website.trim() || undefined,
          description: description.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        handleSuccess("Brand created and added to your account!");
      } else {
        setMessage({ type: "error", text: data.error ?? "Failed to create brand." });
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
        Add Brand
      </button>
    );
  }

  const inputClasses =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#d4772c] focus:outline-none focus:ring-1 focus:ring-[#d4772c]";

  const noResults = !loading && searched && brands.length === 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm w-full max-w-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Add a Brand</h3>
        <button onClick={reset} className="text-gray-400 hover:text-gray-600 text-sm">
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
        placeholder="Type brand name..."
        className={inputClasses}
        autoFocus
      />

      {search.length < 2 && (
        <p className="mt-2 text-xs text-gray-400">Type at least 2 characters to search</p>
      )}

      {loading && <p className="mt-2 text-xs text-gray-400">Searching...</p>}

      {/* Existing brands found — show request buttons */}
      {!loading && brands.length > 0 && (
        <>
          <p className="mt-2 text-xs text-gray-500">Existing brands found:</p>
          <div className="mt-1 max-h-36 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
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
          <p className="mt-2 text-xs text-gray-400">
            Requesting an existing brand requires admin approval.
          </p>
        </>
      )}

      {/* No results — show create brand form */}
      {noResults && (
        <form onSubmit={handleCreate} className="mt-3 space-y-3 border-t border-gray-100 pt-3">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">&quot;{search}&quot;</span> not found. Create it:
          </p>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Industry</label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className={inputClasses}
              placeholder="e.g. Fashion, Tech, Food & Beverage..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Website</label>
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className={inputClasses}
              placeholder="e.g. https://pepsi.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className={inputClasses}
              placeholder="Brief description of the brand..."
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-[#d4772c] px-3 py-2 text-sm font-medium text-white hover:bg-[#b8632a] disabled:opacity-50"
          >
            {submitting ? "Creating..." : `Create "${search.trim()}"`}
          </button>
        </form>
      )}
    </div>
  );
}
