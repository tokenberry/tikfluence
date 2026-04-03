import { z } from "zod"

export const registerSchema = z
  .object({
    role: z.enum(["CREATOR", "NETWORK", "BRAND", "AGENCY"]),
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be under 100 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be under 128 characters"),
    tiktokUsername: z.string().optional(),
    supportsShortVideo: z.boolean().optional(),
    supportsLive: z.boolean().optional(),
    companyName: z.string().optional(),
    industry: z.string().optional(),
    agencyWebsite: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "CREATOR") {
      if (!data.tiktokUsername?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "TikTok username is required for creators",
          path: ["tiktokUsername"],
        })
      }
      if (!data.supportsShortVideo && !data.supportsLive) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select at least one content type",
          path: ["supportsShortVideo"],
        })
      }
    }
    if (
      (data.role === "NETWORK" || data.role === "BRAND" || data.role === "AGENCY") &&
      !data.companyName?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Company name is required",
        path: ["companyName"],
      })
    }
    if (data.agencyWebsite && data.agencyWebsite.trim()) {
      try {
        new URL(data.agencyWebsite)
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please enter a valid URL",
          path: ["agencyWebsite"],
        })
      }
    }
  })

export type RegisterInput = z.infer<typeof registerSchema>

export const ticketSchema = z.object({
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(200, "Subject must be under 200 characters"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(5000, "Description must be under 5000 characters"),
})

export type TicketInput = z.infer<typeof ticketSchema>
