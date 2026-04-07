import { describe, it, expect } from "vitest"
import {
  canReviewDeliveryAsRole,
  canViewOrder,
  isAccountManager,
  isAdmin,
  isAgency,
  isBrand,
  isCreator,
  isNetwork,
} from "@/lib/guards"

describe("role predicates", () => {
  it("isAdmin matches only ADMIN", () => {
    expect(isAdmin("ADMIN")).toBe(true)
    expect(isAdmin("BRAND")).toBe(false)
    expect(isAdmin(null)).toBe(false)
    expect(isAdmin(undefined)).toBe(false)
  })

  it("isBrand matches only BRAND", () => {
    expect(isBrand("BRAND")).toBe(true)
    expect(isBrand("CREATOR")).toBe(false)
    expect(isBrand(null)).toBe(false)
  })

  it("isCreator, isNetwork, isAgency, isAccountManager", () => {
    expect(isCreator("CREATOR")).toBe(true)
    expect(isNetwork("NETWORK")).toBe(true)
    expect(isAgency("AGENCY")).toBe(true)
    expect(isAccountManager("ACCOUNT_MANAGER")).toBe(true)
    expect(isCreator("BRAND")).toBe(false)
  })
})

describe("canReviewDeliveryAsRole", () => {
  it("permits ADMIN and BRAND", () => {
    expect(canReviewDeliveryAsRole("ADMIN")).toBe(true)
    expect(canReviewDeliveryAsRole("BRAND")).toBe(true)
  })

  it("rejects creator / network / agency / account manager / null", () => {
    expect(canReviewDeliveryAsRole("CREATOR")).toBe(false)
    expect(canReviewDeliveryAsRole("NETWORK")).toBe(false)
    expect(canReviewDeliveryAsRole("AGENCY")).toBe(false)
    expect(canReviewDeliveryAsRole("ACCOUNT_MANAGER")).toBe(false)
    expect(canReviewDeliveryAsRole(null)).toBe(false)
    expect(canReviewDeliveryAsRole(undefined)).toBe(false)
  })
})

describe("canViewOrder", () => {
  const base = {
    brandUserId: "brand-1",
    assignedUserIds: ["creator-1"] as const,
  }

  it("ADMIN can view any order", () => {
    expect(
      canViewOrder({
        ...base,
        userId: "stranger",
        role: "ADMIN",
      })
    ).toBe(true)
  })

  it("brand owner can view their own order", () => {
    expect(
      canViewOrder({
        ...base,
        userId: "brand-1",
        role: "BRAND",
      })
    ).toBe(true)
  })

  it("a non-owner brand cannot view someone else's order", () => {
    expect(
      canViewOrder({
        ...base,
        userId: "brand-2",
        role: "BRAND",
      })
    ).toBe(false)
  })

  it("assigned creator can view the order", () => {
    expect(
      canViewOrder({
        ...base,
        userId: "creator-1",
        role: "CREATOR",
      })
    ).toBe(true)
  })

  it("unassigned creator cannot view the order", () => {
    expect(
      canViewOrder({
        ...base,
        userId: "creator-2",
        role: "CREATOR",
      })
    ).toBe(false)
  })

  it("managing agency can view", () => {
    expect(
      canViewOrder({
        ...base,
        userId: "agency-1",
        role: "AGENCY",
        agencyUserId: "agency-1",
      })
    ).toBe(true)
  })

  it("other agency cannot view", () => {
    expect(
      canViewOrder({
        ...base,
        userId: "agency-9",
        role: "AGENCY",
        agencyUserId: "agency-1",
      })
    ).toBe(false)
  })

  it("assigned account manager can view", () => {
    expect(
      canViewOrder({
        ...base,
        userId: "am-1",
        role: "ACCOUNT_MANAGER",
        accountManagerUserIds: ["am-1", "am-2"],
      })
    ).toBe(true)
  })

  it("unassigned account manager cannot view", () => {
    expect(
      canViewOrder({
        ...base,
        userId: "am-3",
        role: "ACCOUNT_MANAGER",
        accountManagerUserIds: ["am-1", "am-2"],
      })
    ).toBe(false)
  })

  it("random stranger with no role cannot view", () => {
    expect(
      canViewOrder({
        ...base,
        userId: "stranger",
        role: null,
      })
    ).toBe(false)
  })

  it("handles an order with no assignments", () => {
    expect(
      canViewOrder({
        brandUserId: "brand-1",
        assignedUserIds: [],
        userId: "brand-1",
        role: "BRAND",
      })
    ).toBe(true)
    expect(
      canViewOrder({
        brandUserId: "brand-1",
        assignedUserIds: [],
        userId: "stranger",
        role: "CREATOR",
      })
    ).toBe(false)
  })
})
