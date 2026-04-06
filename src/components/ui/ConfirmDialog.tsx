"use client"

import { useState, type ReactNode } from "react"
import { AlertTriangle, X } from "lucide-react"

interface ConfirmDialogProps {
  open: boolean
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  title: string
  description?: string
  confirmLabel?: string
  confirmVariant?: "danger" | "primary"
  icon?: ReactNode
}

export default function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = "Confirm",
  confirmVariant = "danger",
  icon,
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
    }
  }

  const confirmColors =
    confirmVariant === "danger"
      ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
      : "bg-[#d4772c] hover:bg-[#b8632a] focus:ring-[#d4772c]"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onCancel}
      />
      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-xl">
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 rounded p-1 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-4">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              confirmVariant === "danger"
                ? "bg-red-100 text-red-600"
                : "bg-orange-100 text-[#d4772c]"
            }`}
          >
            {icon ?? <AlertTriangle className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {description && (
              <p className="mt-1 text-sm text-gray-500">{description}</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 ${confirmColors}`}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
