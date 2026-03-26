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
