export interface BusinessProfile {
  businessName: string
  gstin: string
  phone: string
  email: string
  address: string

  bankName: string
  accountHolder: string
  accountNumber: string
  ifsc: string
  upiId: string
}

export function getBusinessProfile(): BusinessProfile | null {
  if (typeof window === "undefined") return null

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getActiveOrGlobalItem } = require("@/lib/userStore") as typeof import("@/lib/userStore")
  const data = getActiveOrGlobalItem("businessProfile")

  if (!data) return null

  return JSON.parse(data)
}

export function saveBusinessProfile(profile: BusinessProfile) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { setActiveOrGlobalItem } = require("@/lib/userStore") as typeof import("@/lib/userStore")
  setActiveOrGlobalItem("businessProfile", JSON.stringify(profile))
}