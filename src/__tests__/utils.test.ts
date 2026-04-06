import { describe, it, expect } from "vitest"
import { formatCurrency, formatNumber } from "@/lib/utils"

describe("formatCurrency", () => {
  it("formats whole numbers", () => {
    expect(formatCurrency(100)).toBe("$100.00")
  })

  it("formats decimals", () => {
    expect(formatCurrency(49.99)).toBe("$49.99")
  })

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00")
  })

  it("formats large numbers with commas", () => {
    expect(formatCurrency(1234567.89)).toBe("$1,234,567.89")
  })
})

describe("formatNumber", () => {
  it("formats millions", () => {
    expect(formatNumber(1_500_000)).toBe("1.5M")
  })

  it("formats thousands", () => {
    expect(formatNumber(45_000)).toBe("45.0K")
  })

  it("returns raw number for small values", () => {
    expect(formatNumber(999)).toBe("999")
  })

  it("formats exactly 1000", () => {
    expect(formatNumber(1000)).toBe("1.0K")
  })

  it("formats exactly 1 million", () => {
    expect(formatNumber(1_000_000)).toBe("1.0M")
  })
})
