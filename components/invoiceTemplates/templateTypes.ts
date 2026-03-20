import type { InvoiceVisibilitySettings } from "@/context/SettingsContext"

export type TemplateBusinessRecord = {
  businessName?: string
  address?: string
  phone?: string
  email?: string
  gst?: string
  bankName?: string
  accountNumber?: string
  ifsc?: string
  upi?: string
  terms?: string
  logo?: string
  logoShape?: "square" | "round"
}

export type TemplateCustomDetail = {
  label?: string
  value?: string
}

export type TemplateInvoiceItem = {
  product?: string
  hsn?: string
  qty?: number
  price?: number
  cgst?: number | string
  sgst?: number | string
  igst?: number | string
  total?: number
}

export type TemplateInvoiceRecord = {
  invoiceNumber?: string
  clientName?: string
  clientPhone?: string
  clientEmail?: string
  clientGST?: string
  clientAddress?: string
  date?: string
  customDetails?: TemplateCustomDetail[]
  items?: TemplateInvoiceItem[]
  grandTotal?: number
  isPreview?: boolean
}

export type TemplateMoney = (value: number) => string
export type TemplateGst = (rate: string | number | null | undefined, amount: number) => string
export type TemplateDate = (value: string, format: string) => string

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TemplateTheme = any

export type TemplateComponentProps = {
  invoice?: TemplateInvoiceRecord | null
  business?: TemplateBusinessRecord | null
  templateId?: string
  fontFamily?: string
  fontSize?: number
  renderContext?: "screen" | "pdf"
  subtotal?: number
  totalCGST?: number
  totalSGST?: number
  totalIGST?: number
  money: TemplateMoney
  gstDisplay: TemplateGst
  formatDate?: TemplateDate
  dateFormat: string
  invoiceVisibility?: InvoiceVisibilitySettings
}

export type TemplateHeaderProps = {
  invoice?: TemplateInvoiceRecord
  businessInfo: TemplateBusinessRecord
  formatDate?: TemplateDate
  dateFormat: string
  theme: TemplateTheme
  visibility: InvoiceVisibilitySettings
}

export type TemplateInfoProps = {
  invoice?: TemplateInvoiceRecord
  details: TemplateCustomDetail[]
  theme: TemplateTheme
  visibility: InvoiceVisibilitySettings
}

export type TemplateItemsProps = {
  invoice?: TemplateInvoiceRecord
  money: TemplateMoney
  gstDisplay: TemplateGst
  theme: TemplateTheme
}

export type TemplateSummaryProps = {
  invoice?: TemplateInvoiceRecord
  subtotal?: number
  totalCGST?: number
  totalSGST?: number
  totalIGST?: number
  money: TemplateMoney
  theme: TemplateTheme
}

export type TemplateFooterProps = {
  businessInfo: TemplateBusinessRecord
  theme?: TemplateTheme
  visibility: InvoiceVisibilitySettings
}
