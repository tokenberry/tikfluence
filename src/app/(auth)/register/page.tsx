"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

type Role = "CREATOR" | "NETWORK" | "BRAND"

export default function RegisterPage() {
  const router = useRouter()
  const [role, setRole] = useState<Role>("CREATOR")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [tiktokUsername, setTiktokUsername] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [industry, setIndustry] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Client-side validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }
    if (name.length < 2) {
      setError("Name must be at least 2 characters")
      return
    }
    if (role === "CREATOR" && !tiktokUsername.trim()) {
      setError("TikTok username is required for creators")
      return
    }
    if (role === "NETWORK" && !companyName.trim()) {
      setError("Company name is required for networks")
      return
    }
    if (role === "BRAND" && !companyName.trim()) {
      setError("Company name is required for brands")
      return
    }

    setLoading(true)

    try {
      const body: Record<string, string> = {
        name,
        email,
        password,
        role,
      }

      if (role === "CREATOR") {
        body.tiktokUsername = tiktokUsername
      } else if (role === "NETWORK") {
        body.companyName = companyName
      } else if (role === "BRAND") {
        body.brandCompanyName = companyName
        if (industry) body.industry = industry
      }

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Registration failed")
        return
      }

      router.push("/login?registered=true")
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
        <h1 className="text-2xl font-bold text-gray-900">Create an account</h1>
        <p className="text-sm text-gray-500 mt-1">
          Join Foxolog and start collaborating
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

        {/* Common fields */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Full Name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#d4772c] focus:border-[#d4772c]"
            placeholder="Your full name"
          />
        </div>

        <div>
          <label
            htmlFor="reg-email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email
          </label>
          <input
            id="reg-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#d4772c] focus:border-[#d4772c]"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="reg-password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Password
          </label>
          <input
            id="reg-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#d4772c] focus:border-[#d4772c]"
            placeholder="At least 8 characters"
          />
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
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-[#d4772c] hover:text-[#c86b1e] font-medium"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
