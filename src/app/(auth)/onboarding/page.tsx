"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

type Role = "CREATOR" | "NETWORK" | "BRAND"

export default function OnboardingPage() {
  const router = useRouter()
  const { update } = useSession()
  const [role, setRole] = useState<Role>("CREATOR")
  const [tiktokUsername, setTiktokUsername] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [industry, setIndustry] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (role === "CREATOR" && !tiktokUsername.trim()) {
      setError("TikTok username is required for creators")
      return
    }
    if ((role === "NETWORK" || role === "BRAND") && !companyName.trim()) {
      setError("Company name is required")
      return
    }

    setLoading(true)

    try {
      const body: Record<string, string> = { role }

      if (role === "CREATOR") {
        body.tiktokUsername = tiktokUsername
      } else if (role === "NETWORK") {
        body.companyName = companyName
      } else if (role === "BRAND") {
        body.companyName = companyName
        if (industry) body.industry = industry
      }

      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to complete setup")
        return
      }

      // Trigger session update to refresh the role in JWT
      await update()

      // Redirect to role-specific dashboard
      const dashboardMap: Record<Role, string> = {
        CREATOR: "/creator/orders",
        NETWORK: "/network/creators",
        BRAND: "/brand/orders",
      }
      router.push(dashboardMap[role])
      router.refresh()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const roles: { value: Role; label: string; description: string }[] = [
    {
      value: "CREATOR",
      label: "Creator",
      description: "I create TikTok content",
    },
    {
      value: "NETWORK",
      label: "Creator Network",
      description: "I manage multiple creators",
    },
    {
      value: "BRAND",
      label: "Brand",
      description: "I want to promote my brand",
    },
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Complete your profile
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Tell us about yourself to get started on Foxolog
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Role selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            I am a...
          </label>
          <div className="grid grid-cols-3 gap-2">
            {roles.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`p-3 rounded-md border text-center transition-colors ${
                  role === r.value
                    ? "border-[#d4772c] bg-[#fdf6e3] text-[#b85c1a]"
                    : "border-gray-200 text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="block text-sm font-medium">{r.label}</span>
                <span className="block text-xs text-gray-500 mt-0.5">
                  {r.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Role-specific fields */}
        {role === "CREATOR" && (
          <div>
            <label
              htmlFor="tiktok"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              TikTok Username
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                @
              </span>
              <input
                id="tiktok"
                type="text"
                required
                value={tiktokUsername}
                onChange={(e) => setTiktokUsername(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md text-sm focus:outline-none focus:ring-2 focus:ring-[#d4772c] focus:border-[#d4772c]"
                placeholder="your_tiktok_handle"
              />
            </div>
          </div>
        )}

        {role === "NETWORK" && (
          <div>
            <label
              htmlFor="company-network"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Company Name
            </label>
            <input
              id="company-network"
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#d4772c] focus:border-[#d4772c]"
              placeholder="Your network's company name"
            />
          </div>
        )}

        {role === "BRAND" && (
          <>
            <div>
              <label
                htmlFor="company-brand"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Company Name
              </label>
              <input
                id="company-brand"
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#d4772c] focus:border-[#d4772c]"
                placeholder="Your brand's company name"
              />
            </div>
            <div>
              <label
                htmlFor="industry"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Industry
              </label>
              <input
                id="industry"
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#d4772c] focus:border-[#d4772c]"
                placeholder="e.g. Fashion, Tech, Food"
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-[#d4772c] text-white text-sm font-medium rounded-md hover:bg-[#b85c1a] focus:outline-none focus:ring-2 focus:ring-[#c86b1e] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Setting up..." : "Get started"}
        </button>
      </form>
    </div>
  )
}
