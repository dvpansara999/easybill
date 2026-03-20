// @ts-nocheck
"use client"

import Image from "next/image"
import { invoiceTemplateRootTypographyStyle } from "@/lib/invoiceTemplateRootStyle"
import { previewBusiness } from "@/lib/templatePreviewData"
import { getActiveOrGlobalItem } from "@/lib/userStore"
import { DEFAULT_INVOICE_VISIBILITY, type InvoiceVisibilitySettings } from "@/context/SettingsContext"

export const templateMeta = {
  id: "default",
  name: "Default",
  category: "default",
}

type BusinessRecord = {
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

type InvoiceItem = {
  product?: string
  hsn?: string
  qty?: number
  price?: number
  cgst?: number | string
  sgst?: number | string
  igst?: number | string
  total?: number
}

type InvoiceRecord = {
  invoiceNumber?: string
  clientName?: string
  clientPhone?: string
  clientEmail?: string
  clientGST?: string
  clientAddress?: string
  date?: string
  customDetails?: Array<{ label?: string; value?: string }>
  items?: InvoiceItem[]
  grandTotal?: number
  isPreview?: boolean
}

type TemplateMoney = (value: number) => string
type TemplateGst = (rate: unknown, amount: number) => string
type TemplateDate = (value: string, format: string) => string

type DefaultTemplateProps = {
  invoice?: InvoiceRecord
  business?: BusinessRecord | null
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

function logoFrameClass(shape: "square" | "round" = "square") {
  return shape === "round"
    ? "h-16 w-16 rounded-full border border-gray-200 bg-white p-1 object-cover"
    : "h-16 w-16 rounded-2xl border border-gray-200 bg-white p-1 object-cover"
}

function readStoredBusiness() {
  if (typeof window === "undefined") return null

  const saved = getActiveOrGlobalItem("businessProfile")
  if (!saved) return null

  try {
    return JSON.parse(saved) as BusinessRecord
  } catch {
    return null
  }
}

export default function DefaultTemplate({
  invoice,
  business: businessProp,
  fontFamily,
  fontSize,
  renderContext = "screen",
  subtotal = 0,
  totalCGST = 0,
  totalSGST = 0,
  totalIGST = 0,
  money,
  gstDisplay,
  formatDate,
  dateFormat,
  invoiceVisibility,
}: DefaultTemplateProps) {
  const visibility = invoiceVisibility || DEFAULT_INVOICE_VISIBILITY
  const business: BusinessRecord | null =
    businessProp || ((invoice?.isPreview ? previewBusiness : readStoredBusiness()) as BusinessRecord | null)

  if (!business) return null

  return (
    <div
      className="w-full bg-white p-6 leading-relaxed text-gray-800"
      style={invoiceTemplateRootTypographyStyle(fontFamily, fontSize, renderContext)}
    >
      <div className="mb-8 flex justify-between border-b pb-6">
        <div className="flex gap-4">
          {visibility.businessLogo && business.logo ? (
            <div className={`relative overflow-hidden ${logoFrameClass(business.logoShape)}`}>
              <Image src={business.logo} alt="" fill unoptimized className="object-cover" />
            </div>
          ) : null}

          <div>
            {visibility.businessName ? (
              <h1 className="pb-[2px] text-2xl font-semibold tracking-wide">{business.businessName}</h1>
            ) : null}

            {visibility.businessAddress ? <p className="mt-1 whitespace-pre-line text-gray-600">{business.address}</p> : null}

            <div className="mt-2 space-y-1 text-sm text-gray-700">
              {visibility.businessPhone && business.phone ? <p>Phone: {business.phone}</p> : null}
              {business.email ? <p>Email: {business.email}</p> : null}
              {visibility.businessGstin && business.gst ? <p>GSTIN: {business.gst}</p> : null}
            </div>
          </div>
        </div>

        <div className="flex min-w-[160px] flex-col items-end gap-1 text-right text-sm">
          <p className="whitespace-nowrap">
            <span className="text-gray-500">Invoice No:</span> <b className="whitespace-nowrap">{invoice?.invoiceNumber}</b>
          </p>

          <p className="whitespace-nowrap">
            <span className="text-gray-500">Date:</span> {formatDate?.(invoice?.date || "", dateFormat)}
          </p>
        </div>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-10">
        <div>
          <h3 className="mb-2 text-xs uppercase tracking-wider text-gray-500">Bill To</h3>
          <p className="text-base font-semibold">{visibility.clientName ? invoice?.clientName : "-"}</p>

          <div className="mt-1 space-y-1 text-sm">
            {visibility.clientPhone && invoice?.clientPhone ? <p>{invoice.clientPhone}</p> : null}
            {invoice?.clientEmail ? <p>{invoice.clientEmail}</p> : null}
            {visibility.clientGstin && invoice?.clientGST ? <p>GSTIN: {invoice.clientGST}</p> : null}
            {visibility.clientAddress && invoice?.clientAddress ? <p className="mt-1 text-sm">Address: {invoice.clientAddress}</p> : null}
          </div>
        </div>

        <div>
          {invoice?.customDetails && invoice.customDetails.length > 0 ? (
            <>
              <h3 className="mb-2 text-xs uppercase tracking-wider text-gray-500">Additional Details</h3>

              <div className="space-y-1 text-sm">
                {invoice.customDetails.map((detail, index) => (
                  <p key={index}>
                    <b>{detail.label}:</b> {detail.value}
                  </p>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-sm border border-gray-300">
        <div className="border-b bg-gray-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Invoice Items</p>
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-gray-50 text-sm text-gray-600">
              <th className="px-2 py-3 text-left">Item</th>
              <th className="px-2 py-3 text-left">HSN</th>
              <th className="px-2 py-3 text-left">Qty</th>
              <th className="px-2 py-3 text-left">Price</th>
              <th className="px-2 py-3 text-left">CGST</th>
              <th className="px-2 py-3 text-left">SGST</th>
              <th className="px-2 py-3 text-left">IGST</th>
              <th className="px-2 py-3 text-right">Amount</th>
            </tr>
          </thead>

          <tbody>
            {invoice?.items?.map((item, index) => {
              const base = Number(item.qty || 0) * Number(item.price || 0)
              const cgstAmount = item.cgst ? (base * Number(item.cgst)) / 100 : 0
              const sgstAmount = item.sgst ? (base * Number(item.sgst)) / 100 : 0
              const igstAmount = item.igst ? (base * Number(item.igst)) / 100 : 0
              const total = base + cgstAmount + sgstAmount + igstAmount

              return (
                <tr key={index} className="border-b">
                  <td className="px-2 py-3">{item.product || "-"}</td>
                  <td className="px-2 py-3">{item.hsn || "-"}</td>
                  <td className="px-2 py-3">{item.qty}</td>
                  <td className="px-2 py-3">{money(Number(item.price || 0))}</td>
                  <td className="px-2 py-3">{gstDisplay(item.cgst, cgstAmount)}</td>
                  <td className="px-2 py-3">{gstDisplay(item.sgst, sgstAmount)}</td>
                  <td className="px-2 py-3">{gstDisplay(item.igst, igstAmount)}</td>
                  <td className="px-2 py-3 text-right font-medium">{money(total)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-10 flex justify-end">
        <div className="w-80 overflow-hidden rounded-sm border border-gray-300">
          <div className="border-b bg-gray-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Invoice Summary</p>
          </div>

          <div className="p-4 text-sm">
            <div className="flex justify-between py-1">
              <span>Subtotal</span>
              <span>{money(subtotal)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>CGST</span>
              <span>{totalCGST ? money(totalCGST) : "-"}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>SGST</span>
              <span>{totalSGST ? money(totalSGST) : "-"}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>IGST</span>
              <span>{totalIGST ? money(totalIGST) : "-"}</span>
            </div>

            <div className="mt-2 flex justify-between border-t pt-2 text-lg font-semibold">
              <span>Total</span>
              <span>{money(Number(invoice?.grandTotal || 0))}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-14 grid grid-cols-2 gap-10 border-t pt-6">
        <div>
          {visibility.businessBankDetails && (business.bankName || business.accountNumber || business.upi) ? (
            <>
              <h3 className="mb-2 text-xs uppercase tracking-wider text-gray-500">Bank Details</h3>
              <div className="space-y-1 text-sm">
                {business.bankName ? <p>Bank: {business.bankName}</p> : null}
                {business.accountNumber ? <p>Account: {business.accountNumber}</p> : null}
                {business.ifsc ? <p>IFSC: {business.ifsc}</p> : null}
                {business.upi ? <p>UPI: {business.upi}</p> : null}
              </div>
            </>
          ) : null}
        </div>

        <div>
          {visibility.businessTerms && business.terms ? (
            <>
              <h3 className="mb-2 text-xs uppercase tracking-wider text-gray-500">Terms</h3>
              <p className="whitespace-pre-line text-sm text-gray-600">{business.terms}</p>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
