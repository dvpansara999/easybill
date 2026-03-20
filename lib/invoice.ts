export type CustomDetail = {
  label: string
  value: string
}

export type InvoiceItem = {
  product: string
  hsn: string
  qty: number
  unit: string
  price: number
  cgst: number
  sgst: number
  igst: number
  total: number
}

export type InvoiceRecord = {
  invoiceNumber: string
  clientName: string
  clientPhone: string
  clientEmail: string
  clientGST: string
  clientAddress: string
  date: string
  customDetails: CustomDetail[]
  items: InvoiceItem[]
  grandTotal: number
}

export type BusinessRecord = {
  businessName: string
  address: string
  gst: string
  phone: string
  email: string
  bankName: string
  accountNumber: string
  ifsc: string
  upi: string
  terms: string
  logo: string
  logoShape: "square" | "round"
}

export function createEmptyInvoiceItem(): InvoiceItem {
  return {
    product: "",
    hsn: "",
    qty: 1,
    unit: "",
    price: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    total: 0,
  }
}

export function normalizeInvoiceItem(item: Partial<InvoiceItem>): InvoiceItem {
  const qty = Number(item.qty ?? 1)
  const price = Number(item.price ?? 0)
  const cgst = Number(item.cgst ?? 0)
  const sgst = Number(item.sgst ?? 0)
  const igst = Number(item.igst ?? 0)

  const base = qty * price
  const total = base + (base * cgst) / 100 + (base * sgst) / 100 + (base * igst) / 100

  return {
    product: item.product?.trim() || "",
    hsn: item.hsn?.trim() || "",
    qty,
    unit: item.unit?.trim() || "",
    price,
    cgst,
    sgst,
    igst,
    total,
  }
}

export function normalizeInvoiceRecord(invoice: Partial<InvoiceRecord>): InvoiceRecord {
  const items = Array.isArray(invoice.items)
    ? invoice.items.map((item) => normalizeInvoiceItem(item))
    : []

  const grandTotal =
    Number(invoice.grandTotal) ||
    items.reduce((sum, item) => sum + Number(item.total || 0), 0)

  return {
    invoiceNumber: invoice.invoiceNumber?.trim() || "",
    clientName: invoice.clientName?.trim() || "",
    clientPhone: invoice.clientPhone?.trim() || "",
    clientEmail: invoice.clientEmail?.trim() || "",
    clientGST: invoice.clientGST?.trim() || "",
    clientAddress: invoice.clientAddress?.trim() || "",
    date: invoice.date?.trim() || "",
    customDetails: Array.isArray(invoice.customDetails)
      ? invoice.customDetails
          .map((detail) => ({
            label: detail.label?.trim() || "",
            value: detail.value?.trim() || "",
          }))
          .filter((detail) => detail.label || detail.value)
      : [],
    items,
    grandTotal,
  }
}

export function getStoredBusinessRecord(): BusinessRecord | null {
  if (typeof window === "undefined") {
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getActiveOrGlobalItem } = require("@/lib/userStore") as typeof import("@/lib/userStore")
  const stored = getActiveOrGlobalItem("businessProfile")
  if (!stored) {
    // No authenticated Supabase session (e.g. edge flows): `userStore` blocks global keys.
    // Allow reading seeded `localStorage.businessProfile` when present.
    // So we fall back to localStorage directly when the KV/global read is null.
    try {
      const raw = localStorage.getItem("businessProfile")
      if (!raw) return null
      const parsed = JSON.parse(raw) as Partial<BusinessRecord>
      return {
        businessName: parsed.businessName?.trim() || "",
        address: parsed.address?.trim() || "",
        gst: parsed.gst?.trim() || "",
        phone: parsed.phone?.trim() || "",
        email: parsed.email?.trim() || "",
        bankName: parsed.bankName?.trim() || "",
        accountNumber: parsed.accountNumber?.trim() || "",
        ifsc: parsed.ifsc?.trim() || "",
        upi: parsed.upi?.trim() || "",
        terms: parsed.terms?.trim() || "",
        logo: parsed.logo || "",
        logoShape: parsed.logoShape === "round" ? "round" : "square",
      }
    } catch {
      return null
    }
  }

  const parsed = JSON.parse(stored) as Partial<BusinessRecord>

  return {
    businessName: parsed.businessName?.trim() || "",
    address: parsed.address?.trim() || "",
    gst: parsed.gst?.trim() || "",
    phone: parsed.phone?.trim() || "",
    email: parsed.email?.trim() || "",
    bankName: parsed.bankName?.trim() || "",
    accountNumber: parsed.accountNumber?.trim() || "",
    ifsc: parsed.ifsc?.trim() || "",
    upi: parsed.upi?.trim() || "",
    terms: parsed.terms?.trim() || "",
    logo: parsed.logo || "",
    logoShape: parsed.logoShape === "round" ? "round" : "square",
  }
}

export function validateBusinessRecord(business: BusinessRecord | null) {
  if (!business) {
    return "Please save your business profile first."
  }

  if (!business.businessName) {
    return "Business name is required in Business Profile."
  }

  if (!business.address) {
    return "Business address is required in Business Profile."
  }

  if (!business.phone && !business.email) {
    return "Add at least a business phone or email in Business Profile."
  }

  return null
}

export function validateInvoiceRecord(invoice: InvoiceRecord) {
  if (!invoice.invoiceNumber) {
    return "Invoice number is required."
  }

  if (!invoice.date) {
    return "Invoice date is required."
  }

  if (!invoice.clientName) {
    return "Client name is required."
  }

  if (invoice.items.length === 0) {
    return "Add at least one invoice item."
  }

  const hasInvalidItem = invoice.items.some(
    (item) => !item.product || item.qty <= 0 || item.price <= 0
  )

  if (hasInvalidItem) {
    return "Each invoice item needs a product name, quantity, and price greater than 0."
  }

  return null
}
