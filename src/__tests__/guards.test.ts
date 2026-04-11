import { describe, it, expect } from "vitest"
import {
  canAccessOrderThread,
  canInviteCreator,
  canManageShipping,
  canReceiveShipment,
  canRespondToInvitation,
  canReviewContentDraft,
  canReviewDeliveryAsRole,
  canUploadContentDraft,
  canViewContentDrafts,
  canViewMatches,
  canViewOrder,
  canViewShipping,
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

describe("canAccessOrderThread", () => {
  const base = {
    brandUserId: "brand-1",
    assignmentUserIds: ["creator-1"] as const,
  }

  it("ADMIN can always participate", () => {
    expect(
      canAccessOrderThread({
        ...base,
        userId: "stranger",
        role: "ADMIN",
      })
    ).toBe(true)
  })

  it("brand owner can participate in any thread on their own order", () => {
    expect(
      canAccessOrderThread({
        ...base,
        userId: "brand-1",
        role: "BRAND",
        assignmentUserIds: ["creator-1", "creator-2"],
      })
    ).toBe(true)
  })

  it("other brands cannot participate", () => {
    expect(
      canAccessOrderThread({
        ...base,
        userId: "brand-2",
        role: "BRAND",
      })
    ).toBe(false)
  })

  it("managing agency user can participate", () => {
    expect(
      canAccessOrderThread({
        ...base,
        userId: "agency-1",
        role: "AGENCY",
        agencyUserId: "agency-1",
      })
    ).toBe(true)
  })

  it("unrelated agency cannot participate", () => {
    expect(
      canAccessOrderThread({
        ...base,
        userId: "agency-9",
        role: "AGENCY",
        agencyUserId: "agency-1",
      })
    ).toBe(false)
  })

  it("assigned account manager can participate", () => {
    expect(
      canAccessOrderThread({
        ...base,
        userId: "am-1",
        role: "ACCOUNT_MANAGER",
        accountManagerUserIds: ["am-1"],
      })
    ).toBe(true)
  })

  it("unassigned account manager cannot participate", () => {
    expect(
      canAccessOrderThread({
        ...base,
        userId: "am-9",
        role: "ACCOUNT_MANAGER",
        accountManagerUserIds: ["am-1"],
      })
    ).toBe(false)
  })

  it("assigned creator can participate in their own thread", () => {
    expect(
      canAccessOrderThread({
        ...base,
        userId: "creator-1",
        role: "CREATOR",
      })
    ).toBe(true)
  })

  it("creator cannot read another creator's thread on the same order", () => {
    expect(
      canAccessOrderThread({
        brandUserId: "brand-1",
        assignmentUserIds: ["creator-2"],
        userId: "creator-1",
        role: "CREATOR",
      })
    ).toBe(false)
  })

  it("unassigned creator cannot participate at all", () => {
    expect(
      canAccessOrderThread({
        ...base,
        userId: "creator-3",
        role: "CREATOR",
      })
    ).toBe(false)
  })

  it("network can participate in their own assignment's thread", () => {
    expect(
      canAccessOrderThread({
        brandUserId: "brand-1",
        assignmentUserIds: ["network-user-1"],
        userId: "network-user-1",
        role: "NETWORK",
      })
    ).toBe(true)
  })

  it("random stranger is denied", () => {
    expect(
      canAccessOrderThread({
        ...base,
        userId: "stranger",
        role: null,
      })
    ).toBe(false)
  })

  it("handles empty assignmentUserIds list gracefully", () => {
    expect(
      canAccessOrderThread({
        brandUserId: "brand-1",
        assignmentUserIds: [],
        userId: "brand-1",
        role: "BRAND",
      })
    ).toBe(true)
    expect(
      canAccessOrderThread({
        brandUserId: "brand-1",
        assignmentUserIds: [],
        userId: "creator-1",
        role: "CREATOR",
      })
    ).toBe(false)
  })
})

describe("canUploadContentDraft", () => {
  const base = {
    brandUserId: "brand-1",
    assignmentCreatorUserId: "creator-1",
    assignmentNetworkUserId: "network-1" as string | null,
    agencyUserId: "agency-1" as string | null,
    accountManagerUserIds: ["am-1"] as readonly string[],
  }

  it("the assignment's creator can upload", () => {
    expect(
      canUploadContentDraft({
        ...base,
        userId: "creator-1",
        role: "CREATOR",
      })
    ).toBe(true)
  })

  it("a peer creator on another assignment cannot upload", () => {
    expect(
      canUploadContentDraft({
        ...base,
        userId: "creator-2",
        role: "CREATOR",
      })
    ).toBe(false)
  })

  it("the managing network can upload on the creator's behalf", () => {
    expect(
      canUploadContentDraft({
        ...base,
        userId: "network-1",
        role: "NETWORK",
      })
    ).toBe(true)
  })

  it("a foreign network cannot upload", () => {
    expect(
      canUploadContentDraft({
        ...base,
        userId: "network-9",
        role: "NETWORK",
      })
    ).toBe(false)
  })

  it("network without an assignmentNetworkUserId cannot upload", () => {
    expect(
      canUploadContentDraft({
        ...base,
        assignmentNetworkUserId: null,
        userId: "network-1",
        role: "NETWORK",
      })
    ).toBe(false)
  })

  it("brand, agency, AM, admin cannot upload drafts", () => {
    for (const role of [
      "BRAND",
      "AGENCY",
      "ACCOUNT_MANAGER",
      "ADMIN",
    ] as const) {
      expect(
        canUploadContentDraft({
          ...base,
          userId: "brand-1",
          role,
        })
      ).toBe(false)
    }
  })
})

describe("canReviewContentDraft", () => {
  const base = {
    brandUserId: "brand-1",
    assignmentCreatorUserId: "creator-1",
    assignmentNetworkUserId: "network-1" as string | null,
    agencyUserId: "agency-1" as string | null,
    accountManagerUserIds: ["am-1", "am-2"] as readonly string[],
  }

  it("ADMIN can review any draft", () => {
    expect(
      canReviewContentDraft({
        ...base,
        userId: "random-admin",
        role: "ADMIN",
      })
    ).toBe(true)
  })

  it("brand owner can review drafts on their own orders", () => {
    expect(
      canReviewContentDraft({
        ...base,
        userId: "brand-1",
        role: "BRAND",
      })
    ).toBe(true)
  })

  it("another brand cannot review", () => {
    expect(
      canReviewContentDraft({
        ...base,
        userId: "brand-2",
        role: "BRAND",
      })
    ).toBe(false)
  })

  it("managing agency can review", () => {
    expect(
      canReviewContentDraft({
        ...base,
        userId: "agency-1",
        role: "AGENCY",
      })
    ).toBe(true)
  })

  it("unrelated agency cannot review", () => {
    expect(
      canReviewContentDraft({
        ...base,
        userId: "agency-9",
        role: "AGENCY",
      })
    ).toBe(false)
  })

  it("assigned account manager can review", () => {
    expect(
      canReviewContentDraft({
        ...base,
        userId: "am-2",
        role: "ACCOUNT_MANAGER",
      })
    ).toBe(true)
  })

  it("unassigned account manager cannot review", () => {
    expect(
      canReviewContentDraft({
        ...base,
        userId: "am-9",
        role: "ACCOUNT_MANAGER",
      })
    ).toBe(false)
  })

  it("creator and network cannot review — they only upload", () => {
    expect(
      canReviewContentDraft({
        ...base,
        userId: "creator-1",
        role: "CREATOR",
      })
    ).toBe(false)
    expect(
      canReviewContentDraft({
        ...base,
        userId: "network-1",
        role: "NETWORK",
      })
    ).toBe(false)
  })
})

describe("canViewContentDrafts", () => {
  const base = {
    brandUserId: "brand-1",
    assignmentCreatorUserId: "creator-1",
    assignmentNetworkUserId: "network-1" as string | null,
    agencyUserId: "agency-1" as string | null,
    accountManagerUserIds: ["am-1"] as readonly string[],
  }

  it("is the union of upload and review access", () => {
    // Creator (upload side)
    expect(
      canViewContentDrafts({
        ...base,
        userId: "creator-1",
        role: "CREATOR",
      })
    ).toBe(true)
    // Brand (review side)
    expect(
      canViewContentDrafts({
        ...base,
        userId: "brand-1",
        role: "BRAND",
      })
    ).toBe(true)
    // Random stranger
    expect(
      canViewContentDrafts({
        ...base,
        userId: "stranger",
        role: "CREATOR",
      })
    ).toBe(false)
  })
})

// --- Physical product shipping guards (F3) -------------------------------

describe("canManageShipping", () => {
  const base = {
    brandUserId: "brand-1",
    assignmentCreatorUserId: "creator-1",
    assignmentNetworkUserId: "network-1",
    agencyUserId: "agency-1",
    accountManagerUserIds: ["am-1", "am-2"],
  } as const

  it("admin can manage any shipment", () => {
    expect(
      canManageShipping({ ...base, userId: "admin-xyz", role: "ADMIN" })
    ).toBe(true)
  })

  it("brand owner can manage their own shipment", () => {
    expect(
      canManageShipping({ ...base, userId: "brand-1", role: "BRAND" })
    ).toBe(true)
  })

  it("different brand cannot manage shipment on another brand's order", () => {
    expect(
      canManageShipping({ ...base, userId: "brand-2", role: "BRAND" })
    ).toBe(false)
  })

  it("managing agency can manage shipment", () => {
    expect(
      canManageShipping({ ...base, userId: "agency-1", role: "AGENCY" })
    ).toBe(true)
  })

  it("unrelated agency cannot manage shipment", () => {
    expect(
      canManageShipping({ ...base, userId: "agency-2", role: "AGENCY" })
    ).toBe(false)
  })

  it("assigned account manager can manage shipment", () => {
    expect(
      canManageShipping({
        ...base,
        userId: "am-2",
        role: "ACCOUNT_MANAGER",
      })
    ).toBe(true)
  })

  it("unassigned account manager cannot manage shipment", () => {
    expect(
      canManageShipping({
        ...base,
        userId: "am-999",
        role: "ACCOUNT_MANAGER",
      })
    ).toBe(false)
  })

  it("creator cannot manage shipping (receive only)", () => {
    expect(
      canManageShipping({ ...base, userId: "creator-1", role: "CREATOR" })
    ).toBe(false)
  })

  it("network cannot manage shipping (receive only)", () => {
    expect(
      canManageShipping({ ...base, userId: "network-1", role: "NETWORK" })
    ).toBe(false)
  })
})

describe("canReceiveShipment", () => {
  const base = {
    brandUserId: "brand-1",
    assignmentCreatorUserId: "creator-1",
    assignmentNetworkUserId: "network-1",
    agencyUserId: "agency-1",
    accountManagerUserIds: ["am-1"],
  } as const

  it("the assigned creator can receive their own shipment", () => {
    expect(
      canReceiveShipment({ ...base, userId: "creator-1", role: "CREATOR" })
    ).toBe(true)
  })

  it("another creator cannot receive this shipment", () => {
    expect(
      canReceiveShipment({ ...base, userId: "creator-2", role: "CREATOR" })
    ).toBe(false)
  })

  it("the owning network can receive on the creator's behalf", () => {
    expect(
      canReceiveShipment({ ...base, userId: "network-1", role: "NETWORK" })
    ).toBe(true)
  })

  it("a different network cannot receive this shipment", () => {
    expect(
      canReceiveShipment({ ...base, userId: "network-2", role: "NETWORK" })
    ).toBe(false)
  })

  it("network with no network assigned on this assignment is denied", () => {
    expect(
      canReceiveShipment({
        ...base,
        assignmentNetworkUserId: null,
        userId: "network-1",
        role: "NETWORK",
      })
    ).toBe(false)
  })

  it("brand cannot receive (manage only)", () => {
    expect(
      canReceiveShipment({ ...base, userId: "brand-1", role: "BRAND" })
    ).toBe(false)
  })

  it("admin cannot receive (manage only — support intervention lives on the manage side)", () => {
    expect(
      canReceiveShipment({ ...base, userId: "admin-1", role: "ADMIN" })
    ).toBe(false)
  })
})

describe("canViewShipping", () => {
  const base = {
    brandUserId: "brand-1",
    assignmentCreatorUserId: "creator-1",
    assignmentNetworkUserId: null,
    agencyUserId: null,
    accountManagerUserIds: [],
  } as const

  it("is the union of manage + receive access", () => {
    // Brand (manage side)
    expect(
      canViewShipping({ ...base, userId: "brand-1", role: "BRAND" })
    ).toBe(true)
    // Creator (receive side)
    expect(
      canViewShipping({ ...base, userId: "creator-1", role: "CREATOR" })
    ).toBe(true)
    // Admin (manage side)
    expect(
      canViewShipping({ ...base, userId: "admin-1", role: "ADMIN" })
    ).toBe(true)
    // Random stranger
    expect(
      canViewShipping({ ...base, userId: "stranger", role: "CREATOR" })
    ).toBe(false)
  })
})

describe("canViewMatches (F4)", () => {
  const base = {
    brandUserId: "brand-1",
    agencyUserId: "agency-1",
    accountManagerUserIds: ["am-1", "am-2"],
  }

  it("permits admin regardless of ownership", () => {
    expect(
      canViewMatches({ ...base, userId: "admin-1", role: "ADMIN" })
    ).toBe(true)
  })

  it("permits brand owner", () => {
    expect(
      canViewMatches({ ...base, userId: "brand-1", role: "BRAND" })
    ).toBe(true)
  })

  it("rejects a different brand user", () => {
    expect(
      canViewMatches({ ...base, userId: "brand-2", role: "BRAND" })
    ).toBe(false)
  })

  it("permits the managing agency", () => {
    expect(
      canViewMatches({ ...base, userId: "agency-1", role: "AGENCY" })
    ).toBe(true)
  })

  it("rejects a different agency", () => {
    expect(
      canViewMatches({ ...base, userId: "agency-2", role: "AGENCY" })
    ).toBe(false)
  })

  it("permits an assigned account manager", () => {
    expect(
      canViewMatches({ ...base, userId: "am-1", role: "ACCOUNT_MANAGER" })
    ).toBe(true)
    expect(
      canViewMatches({ ...base, userId: "am-2", role: "ACCOUNT_MANAGER" })
    ).toBe(true)
  })

  it("rejects an account manager not assigned to the brand/agency", () => {
    expect(
      canViewMatches({ ...base, userId: "am-9", role: "ACCOUNT_MANAGER" })
    ).toBe(false)
  })

  it("rejects creator + network + unauthenticated", () => {
    expect(
      canViewMatches({ ...base, userId: "creator-1", role: "CREATOR" })
    ).toBe(false)
    expect(
      canViewMatches({ ...base, userId: "network-1", role: "NETWORK" })
    ).toBe(false)
    expect(canViewMatches({ ...base, userId: "anon", role: null })).toBe(false)
  })

  it("canInviteCreator mirrors canViewMatches exactly", () => {
    expect(
      canInviteCreator({ ...base, userId: "brand-1", role: "BRAND" })
    ).toBe(true)
    expect(
      canInviteCreator({ ...base, userId: "creator-1", role: "CREATOR" })
    ).toBe(false)
  })
})

describe("canRespondToInvitation (F4)", () => {
  it("permits the invited creator", () => {
    expect(
      canRespondToInvitation({
        userId: "creator-1",
        role: "CREATOR",
        invitedCreatorUserId: "creator-1",
      })
    ).toBe(true)
  })

  it("rejects a different creator", () => {
    expect(
      canRespondToInvitation({
        userId: "creator-2",
        role: "CREATOR",
        invitedCreatorUserId: "creator-1",
      })
    ).toBe(false)
  })

  it("rejects networks, brands, agencies, AMs", () => {
    for (const role of ["NETWORK", "BRAND", "AGENCY", "ACCOUNT_MANAGER"] as const) {
      expect(
        canRespondToInvitation({
          userId: "creator-1",
          role,
          invitedCreatorUserId: "creator-1",
        })
      ).toBe(false)
    }
  })

  it("permits admin for support intervention", () => {
    expect(
      canRespondToInvitation({
        userId: "admin-1",
        role: "ADMIN",
        invitedCreatorUserId: "creator-1",
      })
    ).toBe(true)
  })
})
