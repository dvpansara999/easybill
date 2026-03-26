import type { Page } from "playwright/test"
import { revealSensitiveDataFromStorage } from "@/lib/sensitiveData"

export const TEST_USER_ID = "user-e2e-001"
export const TEST_USER_EMAIL = "qa@easybill.test"

type InvoiceItemSeed = {
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

export type InvoiceSeed = {
  id: string
  invoiceNumber: string
  clientName: string
  clientPhone: string
  clientEmail: string
  clientGST: string
  clientAddress: string
  date: string
  customDetails: Array<{ label: string; value: string }>
  items: InvoiceItemSeed[]
  grandTotal: number
}

type SeedState = {
  businessProfile?: Record<string, unknown>
  settings?: Record<string, string>
  invoices?: InvoiceSeed[]
  products?: Array<Record<string, unknown>>
  invoiceTemplate?: string
  invoiceTemplateFontId?: string
  invoiceTemplateFontSize?: number
  subscriptionPlanId?: "free" | "plus"
  invoiceUsageCount?: number
}

export function makeInvoiceSeed(overrides: Partial<InvoiceSeed> = {}): InvoiceSeed {
  return {
    id: "inv-e2e-001",
    invoiceNumber: "INV-0001",
    clientName: "Raj",
    clientPhone: "9999999999",
    clientEmail: "raj@example.com",
    clientGST: "24ABCDE1234F1Z5",
    clientAddress: "Raj Complex, Vadodara",
    date: "2026-03-01",
    customDetails: [],
    items: [
      {
        product: "Consultation",
        hsn: "9983",
        qty: 1,
        unit: "pcs",
        price: 1000,
        cgst: 0,
        sgst: 0,
        igst: 0,
        total: 1000,
      },
    ],
    grandTotal: 1000,
    ...overrides,
  }
}

export async function seedAuthenticatedWorkspace(page: Page, state: SeedState = {}) {
  const payload = {
    userId: TEST_USER_ID,
    email: TEST_USER_EMAIL,
    businessProfile: {
      businessName: "Dr.DOCTOR",
      address: "Vadodara, Gujarat",
      gst: "DOCTOR0001737",
      phone: "9911882233",
      email: "drdoctor@example.com",
      bankName: "HDFC Bank",
      accountNumber: "1234567890",
      ifsc: "HDFC0001234",
      upi: "doctor@upi",
      terms: "Payment due within 7 days.",
      logo: "",
      logoShape: "square",
      ...(state.businessProfile || {}),
    },
    settings: {
      dateFormat: "YYYY-MM-DD",
      amountFormat: "indian",
      showDecimals: "true",
      invoicePrefix: "INV-",
      invoicePadding: "4",
      invoiceStartNumber: "1",
      resetYearly: "true",
      invoiceResetMonthDay: "01-01",
      currencySymbol: "?",
      currencyPosition: "before",
      invoiceVisibility: JSON.stringify({
        showBusinessLogo: true,
        showBusinessName: true,
        showBusinessPhone: true,
        showBusinessEmail: true,
        showBusinessGst: true,
        showBusinessAddress: true,
        showBankDetails: true,
        showTerms: true,
        showClientPhone: true,
        showClientEmail: true,
        showClientGst: true,
        showClientAddress: true,
      }),
      ...(state.settings || {}),
    },
    invoices: state.invoices || [],
    products: state.products || [],
    invoiceTemplate: state.invoiceTemplate || "classic-default",
    invoiceTemplateFontId: state.invoiceTemplateFontId || "system",
    invoiceTemplateFontSize: String(state.invoiceTemplateFontSize || 10),
    subscriptionPlanId: state.subscriptionPlanId || "plus",
    invoiceUsageCount: String(state.invoiceUsageCount ?? state.invoices?.length ?? 0),
  }

  await page.addInitScript(
    (
      seed: {
        userId: string
        email: string
        businessProfile: Record<string, unknown>
        settings: Record<string, string>
        invoices: InvoiceSeed[]
        products: Array<Record<string, unknown>>
        invoiceTemplate: string
        invoiceTemplateFontId: string
        invoiceTemplateFontSize: string
        subscriptionPlanId: "free" | "plus"
        invoiceUsageCount: string
      }
    ) => {
      if (sessionStorage.getItem("__easybillPlaywrightSeeded")) {
        return
      }

      localStorage.clear()
      sessionStorage.clear()
      sessionStorage.setItem("__easybillPlaywrightSeeded", "1")

      localStorage.setItem(
        "authAccounts:v2",
        JSON.stringify([
          {
            userId: seed.userId,
            email: seed.email,
            salt: "seed",
            hash: "seed",
          },
        ])
      )
      localStorage.setItem("authLastUserId", seed.userId)
      sessionStorage.setItem("authActiveUserId", seed.userId)

      localStorage.setItem("businessProfile::" + seed.userId, JSON.stringify(seed.businessProfile))
      localStorage.setItem("invoices::" + seed.userId, JSON.stringify({ schemaVersion: 2, invoices: seed.invoices }))
      localStorage.setItem("products::" + seed.userId, JSON.stringify(seed.products))
      localStorage.setItem("invoiceTemplate::" + seed.userId, seed.invoiceTemplate)
      localStorage.setItem("invoiceTemplateFontId::" + seed.userId, seed.invoiceTemplateFontId)
      localStorage.setItem("invoiceTemplateFontSize::" + seed.userId, seed.invoiceTemplateFontSize)
      localStorage.setItem("subscriptionPlanId::" + seed.userId, seed.subscriptionPlanId)
      localStorage.setItem("invoiceUsageCount::" + seed.userId, seed.invoiceUsageCount)
      localStorage.setItem("invoiceUsageInitialized:v1::" + seed.userId, "1")

      for (const [key, value] of Object.entries(seed.settings)) {
        localStorage.setItem(key + "::" + seed.userId, String(value))
      }
    },
    payload
  )
}

export async function getStoredInvoices(page: Page) {
  return await page.evaluate((userId: string) => {
    const raw = localStorage.getItem(`invoices::${userId}`)
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw) as { invoices?: unknown[] } | unknown[]
      if (Array.isArray(parsed)) return parsed
      return Array.isArray(parsed?.invoices) ? parsed.invoices : []
    } catch {
      return []
    }
  }, TEST_USER_ID)
}

export async function getBusinessProfile(page: Page) {
  const raw = await page.evaluate((userId: string) => {
    return localStorage.getItem(`businessProfile::${userId}`)
  }, TEST_USER_ID)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(revealSensitiveDataFromStorage("businessProfile", raw))
  } catch {
    return null
  }
}

export async function chooseDesktopSelectOption(page: Page, triggerLabel: string, optionLabel: string) {
  await page.getByRole("button", { name: triggerLabel, exact: true }).click()
  await page.getByRole("option", { name: optionLabel, exact: true }).click()
}

export function createPngBuffer(base64: string) {
  return Buffer.from(base64, "base64")
}

export const RED_DOT_PNG = createPngBuffer(
  "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAACHSURBVHhe7dAhAQAADITA719681QAcQbJbjuzMdg0gMGmAQw2DWCwaQCDTQMYbBrAYNMABpsGMNg0gMGmAQw2DWCwaQCDTQMYbBrAYNMABpsGMNg0gMGmAQw2DWCwaQCDTQMYbBrAYNMABpsGMNg0gMGmAQw2DWCwaQCDTQMYbBrAYNMABpsHQ4jh0hEeUY0AAAAASUVORK5CYII="
)

export const BLUE_DOT_PNG = createPngBuffer(
  "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAACLSURBVHhe7dAxAQAgEIDAr2YcY38S3akAwy2MzLn7zIbBpgEMNg1gsGkAg00DGGwawGDTAAabBjDYNIDBpgEMNg1gsGkAg00DGGwawGDTAAabBjDYNIDBpgEMNg1gsGkAg00DGGwawGDTAAabBjDYNIDBpgEMNg1gsGkAg00DGGwawGDTAAabBjDYfCulolk+GIuJAAAAAElFTkSuQmCC"
)

export const PDF_BYTES = Buffer.from(
  `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT /F1 12 Tf 72 120 Td (easyBILL test PDF) Tj ET
endstream
endobj
trailer
<< /Root 1 0 R >>
%%EOF`,
  "utf-8"
)

