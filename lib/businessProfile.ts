export type BusinessProfileRecord = {
  businessName: string
  phone: string
  email: string
  gst: string
  address: string
  bankName: string
  accountNumber: string
  ifsc: string
  upi: string
  terms: string
  logo: string
  logoShape: "square" | "round"
}

export const EMPTY_BUSINESS_PROFILE: BusinessProfileRecord = {
  businessName: "",
  phone: "",
  email: "",
  gst: "",
  address: "",
  bankName: "",
  accountNumber: "",
  ifsc: "",
  upi: "",
  terms: "",
  logo: "",
  logoShape: "square",
}

export function normalizeBusinessProfile(value: unknown): BusinessProfileRecord {
  const parsed = typeof value === "object" && value !== null ? (value as Partial<BusinessProfileRecord>) : {}

  return {
    businessName: parsed.businessName || "",
    phone: parsed.phone || "",
    email: parsed.email || "",
    gst: parsed.gst || "",
    address: parsed.address || "",
    bankName: parsed.bankName || "",
    accountNumber: parsed.accountNumber || "",
    ifsc: parsed.ifsc || "",
    upi: parsed.upi || "",
    terms: typeof parsed.terms === "string" ? parsed.terms : "",
    logo: parsed.logo || "",
    logoShape: parsed.logoShape === "round" ? "round" : "square",
  }
}

export function readNormalizedBusinessProfileFromStorage() {
  if (typeof window === "undefined") return EMPTY_BUSINESS_PROFILE

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getActiveOrGlobalItem } = require("@/lib/userStore") as {
      getActiveOrGlobalItem: (key: string) => string | null
    }
    const raw = getActiveOrGlobalItem("businessProfile")
    if (!raw) return EMPTY_BUSINESS_PROFILE
    return normalizeBusinessProfile(JSON.parse(raw))
  } catch {
    return EMPTY_BUSINESS_PROFILE
  }
}
