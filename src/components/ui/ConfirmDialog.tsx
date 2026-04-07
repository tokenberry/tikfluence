"use client"

import { useState, type ReactNode } from "react"
import { AlertTriangle } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

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
  confirmLabel,
  confirmVariant = "danger",
  icon,
}: ConfirmDialogProps) {
  const t = useTranslations("common")
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel()
      }}
    >
      <DialogContent>
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
              confirmVariant === "danger"
                ? "bg-red-100 text-red-600"
                : "bg-orange-100 text-[#d4772c]"
            )}
          >
            {icon ?? <AlertTriangle className="h-5 w-5" />}
          </div>
          <DialogHeader className="flex-1">
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            {t("cancel")}
          </Button>
          <Button
            variant={confirmVariant === "danger" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? t("processing") : (confirmLabel ?? t("confirm"))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
