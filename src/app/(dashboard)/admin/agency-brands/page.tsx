"use client"

import { useState, useEffect } from "react"
import { StatusBadge } from "@/components/ui/Badge"

interface AgencyBrand {
  id: string
  status: string
  addedAt: string
  notes: string | null
  agency: { id: string; companyName: string; user: { name: string; email: string } }
  brand: { id: string; companyName: string; user: { name: string; email: string } }
}

export default function AdminAgencyBrandsPage() {
  const [claims, setClaims] = useState<AgencyBrand[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("ALL")
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchClaims = () => {
    setLoading(true)
    fetch("/api/admin/agency-brands")
      .then((res) => res.json())
      .then((data) => setClaims(data.agencyBrands ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchClaims() }, [])

  const handleUpdate = async (id: string, status: "APPROVED" | "REJECTED") => {
    setUpdating(id)
    try {
      await fetch("/api/admin/agency-brands", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      })
      fetchClaims()
    } catch {
      // ignore
    } finally {
      setUpdating(null)
    }
  }

  const filtered = filter === "ALL" ? claims : claims.filter((c) => c.status === filter)
  const pendingCount = claims.filter((c) => c.status === "PENDING").length

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agency-Brand Claims</h1>
          <p className="mt-1 text-sm text-gray-500">
            Review and approve agency requests to manage brands
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700">
            {pendingCount} pending
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {["ALL", "PENDING", "APPROVED", "REJECTED"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === tab
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab === "ALL" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <p className="text-gray-500">No {filter === "ALL" ? "" : filter.toLowerCase()} claims found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((claim) => (
            <div
              key={claim.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-900">{claim.agency.companyName}</p>
                  <p className="text-xs text-gray-500">{claim.agency.user.email}</p>
                </div>
                <span className="text-gray-300">&rarr;</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{claim.brand.companyName}</p>
                  <p className="text-xs text-gray-500">{claim.brand.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">
                  {new Date(claim.addedAt).toLocaleDateString()}
                </span>
                <StatusBadge status={claim.status} />
                {claim.status === "PENDING" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(claim.id, "APPROVED")}
                      disabled={updating === claim.id}
                      className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleUpdate(claim.id, "REJECTED")}
                      disabled={updating === claim.id}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
