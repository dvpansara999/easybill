"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { useSettings } from "@/context/SettingsContext"
import { formatDate } from "@/lib/dateFormat"
import { formatCurrency } from "@/lib/formatCurrency"
import { getActiveOrGlobalItem } from "@/lib/userStore"
import { useAppAlert } from "@/components/providers/AppAlertProvider"
import { updateInvoiceViaSupabase } from "@/lib/supabase/invoiceMutations"
import { useWorkspaceValue } from "@/lib/useWorkspaceValue"
import {
  createInvoiceHistoryEntry,
  createEmptyInvoiceItem,
  findInvoiceById,
  getStoredBusinessRecord,
  normalizeInvoiceRecord,
  readStoredInvoices,
  validateBusinessRecord,
  validateInvoiceRecord,
  type CustomDetail,
  type InvoiceItem,
  type InvoiceRecord,
} from "@/lib/invoice"
import { CirclePlus, Package2, Plus, Save, Trash2, UserRound } from "lucide-react"
import { canEditInvoices } from "@/lib/plans"
import InvoicePageHeader from "@/components/invoices/InvoicePageHeader"
import NotFoundRecoveryCard from "@/components/shared/NotFoundRecoveryCard"

type ProductRecord = {
  name: string
  hsn: string
  unit: string
  price: number
  cgst: number
  sgst: number
  igst: number
}

type EditInvoiceSnapshot = {
  products: ProductRecord[]
  invoice: InvoiceRecord | null
  invoices: InvoiceRecord[]
}

function getInvoiceIdFromParams(id: string | string[] | undefined) {
  if (Array.isArray(id)) {
    return id[0] ?? ""
  }

  return id ?? ""
}

function safeParseProducts(raw: string | null): ProductRecord[] {
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((product): product is ProductRecord => {
      return typeof product === "object" && product !== null && "name" in product
    })
  } catch {
    return []
  }
}

function readEditInvoiceSnapshot(invoiceId: string): EditInvoiceSnapshot {
  const products = safeParseProducts(getActiveOrGlobalItem("products"))
  const invoices = readStoredInvoices()
  const invoice = findInvoiceById(invoices, invoiceId)

  return {
    products,
    invoice,
    invoices,
  }
}

function updateTotals(updated: InvoiceItem[], index: number) {
  const row = updated[index]
  const qty = Number(row.qty || 0)
  const price = Number(row.price || 0)
  const cgstRate = Number(row.cgst || 0)
  const sgstRate = Number(row.sgst || 0)
  const igstRate = Number(row.igst || 0)
  const base = qty * price
  const total =
    base +
    base * (cgstRate / 100) +
    base * (sgstRate / 100) +
    base * (igstRate / 100)

  updated[index] = {
    ...row,
    qty,
    price,
    cgst: cgstRate,
    sgst: sgstRate,
    igst: igstRate,
    total,
  }

  return updated
}

type EditInvoiceScreenProps = {
  invoice: InvoiceRecord
  products: ProductRecord[]
  invoices: InvoiceRecord[]
  invoiceId: string
  returnTo: string
}

function EditInvoiceScreen({
  invoice,
  products,
  invoices,
  invoiceId,
  returnTo,
}: EditInvoiceScreenProps) {
  const {
    dateFormat,
    amountFormat,
    showDecimals,
    currencySymbol,
    currencyPosition,
  } = useSettings()

  const router = useRouter()
  const { showAlert } = useAppAlert()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [invoiceNumber] = useState(invoice.invoiceNumber || "")
  const [clientName, setClientName] = useState(invoice.clientName || "")
  const [clientPhone, setClientPhone] = useState(invoice.clientPhone || "")
  const [clientEmail, setClientEmail] = useState(invoice.clientEmail || "")
  const [clientGST, setClientGST] = useState(invoice.clientGST || "")
  const [clientAddress, setClientAddress] = useState(invoice.clientAddress || "")
  const [date] = useState(invoice.date || "")
  const [customDetails, setCustomDetails] = useState<CustomDetail[]>(invoice.customDetails || [])
  const [notes] = useState(invoice.notes || "")
  const [items, setItems] = useState<InvoiceItem[]>(
    invoice.items?.length ? invoice.items : [createEmptyInvoiceItem()]
  )
  const [suggestions, setSuggestions] = useState<ProductRecord[]>([])
  const [activeRow, setActiveRow] = useState<number | null>(null)
  const [updatingInvoice, setUpdatingInvoice] = useState(false)

  useEffect(() => {
    router.prefetch(returnTo)
  }, [returnTo, router])

  useEffect(() => {
    if (!canEditInvoices()) {
      showAlert({
        tone: "warning",
        title: "Editing is locked on the Free plan",
        actionHint: "Upgrade to Plus to unlock editing, or go back to your list.",
        message: "Upgrade to Plus to edit invoices.",
        primaryLabel: "Upgrade to Plus",
        secondaryLabel: "Back",
        onPrimary: () => router.push("/dashboard/upgrade"),
        onSecondary: () => router.push(returnTo),
      })
    }
  }, [router, returnTo, showAlert])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSuggestions([])
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function money(value: number) {
    return formatCurrency(
      value,
      currencySymbol,
      currencyPosition,
      showDecimals,
      amountFormat
    )
  }

  function handleItemChange(index: number, field: keyof InvoiceItem, value: string | number) {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updateTotals(updated, index))
  }

  function searchProduct(index: number, value: string) {
    setActiveRow(index)
    setSuggestions(products.filter((product) => product.name.toLowerCase().includes(value.toLowerCase())))
    handleItemChange(index, "product", value)
  }

  function searchHSN(index: number, value: string) {
    setActiveRow(index)
    setSuggestions(products.filter((product) => String(product.hsn).includes(value)))
    handleItemChange(index, "hsn", value)
  }

  function selectSuggestion(product: ProductRecord) {
    if (activeRow === null) return

    const updated = [...items]
    updated[activeRow] = {
      ...updated[activeRow],
      product: product.name,
      hsn: product.hsn,
      unit: product.unit,
      price: product.price,
      cgst: product.cgst,
      sgst: product.sgst,
      igst: product.igst,
    }

    setItems(updateTotals(updated, activeRow))
    setSuggestions([])
  }

  function addProduct() {
    setItems((prev) => [...prev, createEmptyInvoiceItem()])
  }

  function removeProduct(index: number) {
    setItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
  }

  function addCustomDetail() {
    setCustomDetails((prev) => [...prev, { label: "", value: "" }])
  }

  function removeCustomDetail(index: number) {
    setCustomDetails((prev) => prev.filter((_, detailIndex) => detailIndex !== index))
  }

  function updateCustomDetail(index: number, field: keyof CustomDetail, value: string) {
    setCustomDetails((prev) =>
      prev.map((detail, detailIndex) =>
        detailIndex === index ? { ...detail, [field]: value } : detail
      )
    )
  }

  const subtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0)
  const cgstTotal = items.reduce((sum, item) => sum + item.qty * item.price * (item.cgst / 100), 0)
  const sgstTotal = items.reduce((sum, item) => sum + item.qty * item.price * (item.sgst / 100), 0)
  const igstTotal = items.reduce((sum, item) => sum + item.qty * item.price * (item.igst / 100), 0)
  const grandTotal = subtotal + cgstTotal + sgstTotal + igstTotal

  function goBackToInvoices() {
    router.push(returnTo)
  }

  function updateInvoice() {
    if (updatingInvoice) return
    if (!canEditInvoices()) {
      showAlert({
        tone: "warning",
        title: "Editing is locked on the Free plan",
        actionHint: "Upgrade to Plus to unlock editing, or go back to your invoices.",
        message: "Upgrade to Plus to edit invoices.",
        primaryLabel: "Upgrade to Plus",
        secondaryLabel: "Back",
        onPrimary: () => router.push("/dashboard/upgrade"),
        onSecondary: () => router.push(returnTo),
      })
      return
    }

    const businessError = validateBusinessRecord(getStoredBusinessRecord())

    if (businessError) {
      showAlert({
        tone: "danger",
        title: "Business profile needs attention",
        actionHint: "Open Business Profile, complete the required details, then come back to this invoice.",
        message: businessError,
      })
      return
    }

    const existingInvoice = findInvoiceById(invoices, invoiceId)

    if (!existingInvoice) {
      showAlert({
        tone: "danger",
        title: "Invoice not found",
        actionHint: "Return to your invoice list and pick a valid invoice.",
        message: "This invoice could not be found in your current account.",
        primaryLabel: "Back",
        onPrimary: () => router.push(returnTo),
      })
      return
    }

    const invoiceRecord = normalizeInvoiceRecord({
      id: invoiceId,
      invoiceNumber,
      createdAt: existingInvoice?.createdAt,
      numberingModeAtCreation: existingInvoice?.numberingModeAtCreation,
      resetMonthDayAtCreation: existingInvoice?.resetMonthDayAtCreation,
      sequenceWindowStart: existingInvoice?.sequenceWindowStart,
      sequenceWindowEnd: existingInvoice?.sequenceWindowEnd,
      clientName,
      clientPhone,
      clientEmail,
      clientGST,
      clientAddress,
      date,
      customDetails,
      items,
      notes,
      status: existingInvoice?.status || "draft",
      history: [...(existingInvoice?.history || []), createInvoiceHistoryEntry("edited", "Invoice edited")],
      grandTotal,
    })

    const invoiceError = validateInvoiceRecord(invoiceRecord)

    if (invoiceError) {
      showAlert({
        tone: "danger",
        title: "Missing or invalid invoice details",
        actionHint: "Check required fields (including invoice date), fix any issues, then save again.",
        message: invoiceError,
      })
      return
    }

    setUpdatingInvoice(true)
    void updateInvoiceViaSupabase(invoiceRecord)
      .then(() => {
        showAlert({
          tone: "success",
          title: "Invoice updated",
          actionHint: "View, print, or download the PDF anytime from your list.",
          message: "Your changes have been saved.",
          primaryLabel: "Back to invoices",
          onPrimary: () => router.push(returnTo),
        })
      })
      .catch((error) => {
        showAlert({
          tone: "danger",
          title: "Could not update invoice",
          actionHint: "Please try again. If the problem continues, refresh the page and retry.",
          message: error instanceof Error ? error.message : "Unable to update the invoice right now.",
        })
      })
      .finally(() => {
        window.setTimeout(() => setUpdatingInvoice(false), 400)
      })
  }

  return (
    <div className="space-y-6 pb-24 xl:space-y-8 xl:pb-0">
      <InvoicePageHeader
        eyebrow="Edit Invoice"
        title={`Refine ${invoiceNumber || "invoice"}.`}
        description="Update client details, line items, and custom fields while keeping the original invoice number and date frozen."
        backLabel="Back to invoices"
        onBack={goBackToInvoices}
      />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
        <div className="soft-card rounded-[24px] px-4 py-3 sm:px-5 sm:py-4">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Invoice Number</p>
          <p className="mt-1.5 text-lg font-semibold text-slate-950 sm:mt-2 sm:text-2xl">{invoiceNumber}</p>
        </div>

        <div className="soft-card rounded-[24px] px-4 py-3 sm:px-5 sm:py-4">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Subtotal</p>
          <p className="mt-1.5 text-lg font-semibold text-slate-950 sm:mt-2 sm:text-2xl">{money(subtotal)}</p>
        </div>

        <div className="soft-card rounded-[24px] px-4 py-3 sm:px-5 sm:py-4">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Taxes</p>
          <p className="mt-1.5 text-lg font-semibold text-slate-950 sm:mt-2 sm:text-2xl">{money(cgstTotal + sgstTotal + igstTotal)}</p>
        </div>

        <div className="app-dark-card rounded-[24px] px-4 py-3 text-white sm:px-5 sm:py-4">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Grand Total</p>
          <p className="mt-1.5 text-lg font-semibold sm:mt-2 sm:text-2xl">{money(grandTotal)}</p>
        </div>
      </section>

      <section className="soft-card rounded-[24px] p-4 sm:p-6 xl:rounded-[28px]">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <UserRound className="h-5 w-5" />
          </div>
          <div>
            <h2 className="section-title text-xl sm:text-2xl">Client Details</h2>
            <p className="text-xs text-slate-500 sm:text-sm">Edit the billing information tied to this invoice.</p>
          </div>
        </div>

        <div className="grid min-w-0 gap-3 sm:gap-4 lg:grid-cols-2 xl:grid-cols-[1.15fr_0.8fr_1.25fr_1fr_220px] [&>*]:min-w-0">
          <div className="min-w-0">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Client Name *</label>
            <input placeholder="Client Name" className="app-input h-[54px] w-full rounded-2xl px-4 py-3.5 text-sm outline-none transition" value={clientName} onChange={(event) => setClientName(event.target.value)} />
          </div>
          <div className="min-w-0">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Client Phone</label>
            <input placeholder="Client Phone" className="app-input h-[54px] w-full rounded-2xl px-4 py-3.5 text-sm outline-none transition" value={clientPhone} onChange={(event) => setClientPhone(event.target.value)} />
          </div>
          <div className="min-w-0">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Client Email</label>
            <input placeholder="Client Email" className="app-input h-[54px] w-full rounded-2xl px-4 py-3.5 text-sm outline-none transition" value={clientEmail} onChange={(event) => setClientEmail(event.target.value)} />
          </div>
          <div className="min-w-0">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Client GSTIN</label>
            <input placeholder="Client GSTIN" className="app-input h-[54px] w-full rounded-2xl px-4 py-3.5 text-sm outline-none transition" value={clientGST} onChange={(event) => setClientGST(event.target.value)} />
          </div>
          <div className="min-w-0">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Invoice Date *</label>
            <input
              type="text"
              className="app-input box-border h-[54px] w-full max-w-full min-w-0 rounded-2xl bg-[rgba(246,248,249,0.9)] px-4 py-3.5 text-sm text-slate-500 outline-none"
              value={date ? formatDate(date, dateFormat) : ""}
              readOnly
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:gap-4 xl:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Client Address</label>
            <div className="app-subtle-panel rounded-[24px] p-4">
              <textarea placeholder="Client Address" className="min-h-[148px] w-full resize-none bg-transparent px-0 py-0 text-sm outline-none transition placeholder:text-slate-400 focus:border-transparent focus:ring-0" value={clientAddress} onChange={(event) => setClientAddress(event.target.value)} />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Custom Details</label>
            <div className="app-subtle-panel rounded-[24px] p-4">
              <div className="mb-3 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
                <p className="text-sm text-slate-500">Optional details like project name or work type.</p>
                <button onClick={addCustomDetail} className="app-secondary-button inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium sm:w-auto sm:rounded-full sm:py-2">
                  <CirclePlus className="h-4 w-4" />
                  Add Detail
                </button>
              </div>

              <div className="space-y-3">
                {customDetails.map((detail, index) => (
                  <div key={index} className="grid gap-3 md:grid-cols-[0.35fr_1fr_auto]">
                    <input placeholder="Label" className="app-input h-[48px] rounded-2xl px-4 py-3 text-sm outline-none transition" value={detail.label} onChange={(event) => updateCustomDetail(index, "label", event.target.value)} />

                    <input placeholder="Value" className="app-input h-[48px] rounded-2xl px-4 py-3 text-sm outline-none transition" value={detail.value} onChange={(event) => updateCustomDetail(index, "value", event.target.value)} />

                    <button onClick={() => removeCustomDetail(index)} className="inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-600 transition hover:bg-rose-100">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </section>

      <section className="soft-card rounded-[24px] p-4 sm:p-6 xl:rounded-[28px]">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
            <Package2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="section-title text-xl sm:text-2xl">Invoice Items</h2>
            <p className="text-xs text-slate-500 sm:text-sm">Update products, taxes, and totals with the same layout as create.</p>
          </div>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="app-subtle-panel rounded-[24px] p-3 sm:rounded-[26px] sm:p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Item {index + 1}</p>
                <button
                  onClick={() => removeProduct(index)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                  aria-label={`Remove item ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-[1.7fr_0.95fr_0.62fr_0.7fr_0.9fr_0.68fr_0.68fr_0.68fr_1fr_auto]">
                <div className="relative col-span-2">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Product *</label>
                  <input value={item.product} onChange={(event) => searchProduct(index, event.target.value)} placeholder="Product" className="app-input h-[54px] w-full rounded-2xl px-4 py-3.5 text-sm outline-none transition" />

                  {activeRow === index && suggestions.length > 0 && (
                    <div ref={dropdownRef} className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-[rgba(83,93,105,0.11)] bg-[rgba(255,255,255,0.92)] shadow-[0_20px_52px_rgba(31,41,55,0.12)] backdrop-blur-xl">
                      {suggestions.map((suggestion, suggestionIndex) => (
                        <div key={`${suggestion.name}-${suggestionIndex}`} onClick={() => selectSuggestion(suggestion)} className="cursor-pointer px-4 py-3 text-sm text-slate-700 transition hover:bg-white/80">
                          {suggestion.name} ({suggestion.hsn})
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">HSN</label>
                  <input value={item.hsn} onChange={(event) => searchHSN(index, event.target.value)} placeholder="HSN" className="app-input h-[54px] w-full rounded-2xl px-4 py-3.5 text-sm outline-none transition" />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Qty *</label>
                  <input type="text" inputMode="numeric" value={item.qty} onChange={(event) => handleItemChange(index, "qty", event.target.value === "" ? "" : Number(event.target.value))} placeholder="Qty" className="app-input h-[54px] w-full rounded-2xl px-4 py-3.5 text-sm outline-none transition" />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Unit</label>
                  <input value={item.unit} onChange={(event) => handleItemChange(index, "unit", event.target.value)} placeholder="Unit" className="app-input h-[54px] w-full rounded-2xl px-4 py-3.5 text-sm outline-none transition" />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Price *</label>
                  <input type="text" inputMode="decimal" value={item.price} onChange={(event) => handleItemChange(index, "price", event.target.value === "" ? "" : Number(event.target.value))} placeholder="Price" className="app-input h-[54px] w-full rounded-2xl px-4 py-3.5 text-sm outline-none transition" />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">CGST %</label>
                  <input type="text" inputMode="decimal" value={item.cgst} onChange={(event) => handleItemChange(index, "cgst", event.target.value === "" ? "" : Number(event.target.value))} placeholder="CGST" className="app-input h-[54px] w-full rounded-2xl px-4 py-3.5 text-sm outline-none transition" />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">SGST %</label>
                  <input type="text" inputMode="decimal" value={item.sgst} onChange={(event) => handleItemChange(index, "sgst", event.target.value === "" ? "" : Number(event.target.value))} placeholder="SGST" className="app-input h-[54px] w-full rounded-2xl px-4 py-3.5 text-sm outline-none transition" />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">IGST %</label>
                  <input type="text" inputMode="decimal" value={item.igst} onChange={(event) => handleItemChange(index, "igst", event.target.value === "" ? "" : Number(event.target.value))} placeholder="IGST" className="app-input h-[54px] w-full rounded-2xl px-4 py-3.5 text-sm outline-none transition" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Total</label>
                  <div className="app-subtle-panel flex items-center rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900">{money(item.total)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={addProduct} className="app-secondary-button mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium sm:w-auto">
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </section>

      <section className="soft-card rounded-[24px] p-4 sm:p-6 xl:rounded-[28px]">
        <h2 className="section-title text-xl sm:text-2xl">Invoice Summary</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="app-subtle-panel space-y-3 rounded-[24px] p-5 text-sm text-slate-600">
            <div className="flex justify-between"><span>Subtotal</span><span className="font-semibold text-slate-900">{money(subtotal)}</span></div>
            <div className="flex justify-between"><span>CGST Total</span><span className="font-semibold text-slate-900">{money(cgstTotal)}</span></div>
            <div className="flex justify-between"><span>SGST Total</span><span className="font-semibold text-slate-900">{money(sgstTotal)}</span></div>
            <div className="flex justify-between"><span>IGST Total</span><span className="font-semibold text-slate-900">{money(igstTotal)}</span></div>
          </div>

          <div className="app-dark-card rounded-[24px] p-6 text-white">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Grand Total</p>
            <p className="mt-3 text-3xl font-semibold sm:text-4xl">{money(grandTotal)}</p>
          </div>
        </div>

        <button onClick={updateInvoice} disabled={updatingInvoice} className="app-primary-button mt-5 hidden items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:bg-slate-400 xl:inline-flex">
          <Save className="h-4 w-4" />
          {updatingInvoice ? "Updating..." : "Update Invoice"}
        </button>
      </section>

      <div className="app-sticky-bar eb-safe-bottom-pad fixed inset-x-0 bottom-0 z-40 px-4 pt-3 xl:hidden">
        <button onClick={updateInvoice} disabled={updatingInvoice} className="app-primary-button inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:bg-slate-400">
          <Save className="h-4 w-4" />
          {updatingInvoice ? "Updating..." : "Update Invoice"}
        </button>
      </div>
    </div>
  )
}

export default function EditInvoice() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const invoiceId = getInvoiceIdFromParams(params?.id)
  const returnTo = searchParams.get("returnTo") || "/dashboard/invoices"
  const workspace = useWorkspaceValue(
    ["products", "invoices"],
    () => readEditInvoiceSnapshot(invoiceId)
  )

  if (!workspace.invoice) {
    return (
      <NotFoundRecoveryCard
        title="Invoice not found"
        description="This invoice is no longer available in the current account. You can return to your invoices, go back to the dashboard, or retry syncing your workspace."
        backLabel="Back to invoices"
        onBack={() => router.push(returnTo)}
        onDashboard={() => router.push("/dashboard")}
        onRetry={() => setTimeout(() => window.dispatchEvent(new CustomEvent("easybill:cloud-sync")), 0)}
      />
    )
  }

  return (
    <EditInvoiceScreen
      key={workspace.invoice.id}
      invoice={workspace.invoice}
      products={workspace.products}
      invoices={workspace.invoices}
      invoiceId={invoiceId}
      returnTo={returnTo}
    />
  )
}
