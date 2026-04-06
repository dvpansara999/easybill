"use client"

import { useMemo, useRef, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSettings } from "@/context/SettingsContext"
import { formatCurrency } from "@/lib/formatCurrency"
import {
  generateInvoiceNumber,
  getFirstRepeatedInvoiceNumberWarning,
  getInvoiceNumberingMetadata,
} from "@/lib/invoiceNumber"
import { getActiveOrGlobalItem, isActiveUserKvHydrated } from "@/lib/userStore"
import { bumpInvoiceUsageCount, canCreateAnotherInvoice } from "@/lib/plans"
import { useAppAlert } from "@/components/providers/AppAlertProvider"
import { getAuthMode } from "@/lib/runtimeMode"
import {
  createInvoiceHistoryEntry,
  createInvoiceId,
  createEmptyInvoiceItem,
  type CustomDetail,
  type InvoiceItem,
  findInvoiceById,
  getStoredBusinessRecord,
  normalizeInvoiceRecord,
  readStoredInvoices,
  writeStoredInvoices,
  validateBusinessRecord,
  validateInvoiceRecord,
} from "@/lib/invoice"
import { buildCustomerIdentity } from "@/lib/customerIdentity"
import { CirclePlus, Package2, Plus, Save, Trash2, UserRound } from "lucide-react"
import InvoicePageHeader from "@/components/invoices/InvoicePageHeader"

type ProductRecord = {
  name: string
  hsn: string
  unit: string
  price: number
  cgst: number
  sgst: number
  igst: number
}

type CustomerRecord = {
  name: string
  phone: string
  email: string
  gst: string
  address: string
}

type CreateInvoiceState = {
  products: ProductRecord[]
  items: InvoiceItem[]
  customers: CustomerRecord[]
}

function getTodayLocalDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function readCreateInvoiceState(): CreateInvoiceState {
  const savedProducts = getActiveOrGlobalItem("products")
  let products: ProductRecord[] = []
  if (savedProducts) {
    try {
      const parsed = JSON.parse(savedProducts) as unknown
      products = Array.isArray(parsed) ? (parsed as ProductRecord[]) : []
    } catch {
      products = []
    }
  }
  const invoices = readStoredInvoices()
  const customerMap: Record<string, CustomerRecord> = {}

  invoices.forEach((invoice) => {
    const identity = buildCustomerIdentity(invoice).id
    customerMap[identity] = {
      name: invoice.clientName || "",
      phone: invoice.clientPhone || "",
      email: invoice.clientEmail || "",
      gst: invoice.clientGST || "",
      address: invoice.clientAddress || "",
    }
  })

  return {
    products,
    items: [createEmptyInvoiceItem()],
    customers: Object.values(customerMap),
  }
}

export default function CreateInvoiceClient() {
  const {
    invoicePrefix,
    invoicePadding,
    invoiceStartNumber,
    resetYearly,
    invoiceResetMonthDay,
    amountFormat,
    showDecimals,
    currencySymbol,
    currencyPosition,
  } = useSettings()

  const router = useRouter()
  const searchParams = useSearchParams()
  const { showAlert } = useAppAlert()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const initialState = useMemo(
    () => readCreateInvoiceState(),
    []
  )
  const duplicateInvoiceId = searchParams.get("duplicateId") || ""
  const duplicateSource = useMemo(
    () => (duplicateInvoiceId ? findInvoiceById(readStoredInvoices(), duplicateInvoiceId) : null),
    [duplicateInvoiceId]
  )

  const [products] = useState(initialState.products)
  const [customers] = useState(initialState.customers)
  const [items, setItems] = useState<InvoiceItem[]>(
    duplicateSource?.items?.length ? duplicateSource.items : initialState.items
  )

  const [clientName, setClientName] = useState(duplicateSource?.clientName || searchParams.get("name") || "")
  const [clientPhone, setClientPhone] = useState(duplicateSource?.clientPhone || searchParams.get("phone") || "")
  const [clientEmail, setClientEmail] = useState(duplicateSource?.clientEmail || searchParams.get("email") || "")
  const [clientGST, setClientGST] = useState(duplicateSource?.clientGST || searchParams.get("gstin") || "")
  const [clientAddress, setClientAddress] = useState(duplicateSource?.clientAddress || searchParams.get("address") || "")
  const [date, setDate] = useState(() => getTodayLocalDate())
  const [notes] = useState(duplicateSource?.notes || "")

  const [customDetails, setCustomDetails] = useState<CustomDetail[]>(duplicateSource?.customDetails || [])
  const [suggestions, setSuggestions] = useState<ProductRecord[]>([])
  const [activeRow, setActiveRow] = useState<number | null>(null)
  const [clientSuggestions, setClientSuggestions] = useState<CustomerRecord[]>([])
  const [clientField, setClientField] = useState("")
  const [savingInvoice, setSavingInvoice] = useState(false)

  useEffect(() => {
    router.prefetch("/dashboard/invoices")
  }, [router])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSuggestions([])
        setClientSuggestions([])
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function money(value: number) {
    return formatCurrency(value, currencySymbol, currencyPosition, showDecimals, amountFormat)
  }

  function toNumber(value: unknown) {
    const normalized = String(value ?? "").trim().replace(",", ".")
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : 0
  }

  function updateTotals(updated: InvoiceItem[], index: number) {
    const row = updated[index]
    const qty = toNumber(row.qty)
    const price = toNumber(row.price)
    const base = qty * price
    const cgst = base * (toNumber(row.cgst) / 100)
    const sgst = base * (toNumber(row.sgst) / 100)
    const igst = base * (toNumber(row.igst) / 100)
    updated[index] = { ...row, total: base + cgst + sgst + igst }
    return updated
  }

  function handleItemChange(index: number, field: keyof InvoiceItem, value: string | number) {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updateTotals(updated, index))
  }

  function searchClientName(value: string) {
    setClientName(value)
    setClientField("name")
    const normalized = value.trim().toLowerCase()
    setClientSuggestions(
      customers.filter((customer) => {
        if (!normalized) return true
        return (
          customer.name.toLowerCase().includes(normalized) ||
          customer.phone.toLowerCase().includes(normalized) ||
          customer.gst.toLowerCase().includes(normalized)
        )
      })
    )
  }

  function searchClientPhone(value: string) {
    setClientPhone(value)
    setClientField("phone")
    const normalized = value.trim().toLowerCase()
    setClientSuggestions(
      customers.filter((customer) => {
        if (!normalized) return true
        return (
          String(customer.phone).toLowerCase().includes(normalized) ||
          customer.gst.toLowerCase().includes(normalized)
        )
      })
    )
  }

  function selectClient(customer: CustomerRecord) {
    setClientName(customer.name || "")
    setClientPhone(customer.phone || "")
    setClientEmail(customer.email || "")
    setClientGST(customer.gst || "")
    setClientAddress(customer.address || "")
    setClientSuggestions([])
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
    setItems((prev) => prev.filter((_, currentIndex) => currentIndex !== index))
  }

  function addCustomDetail() {
    setCustomDetails((prev) => [...prev, { label: "", value: "" }])
  }

  function removeCustomDetail(index: number) {
    setCustomDetails((prev) => prev.filter((_, currentIndex) => currentIndex !== index))
  }

  const subtotal = items.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.price || 0), 0)
  const cgstTotal = items.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.price || 0) * (Number(item.cgst || 0) / 100), 0)
  const sgstTotal = items.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.price || 0) * (Number(item.sgst || 0) / 100), 0)
  const igstTotal = items.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.price || 0) * (Number(item.igst || 0) / 100), 0)
  const grandTotal = subtotal + cgstTotal + sgstTotal + igstTotal
  const invoiceNumber = useMemo(() => {
    const invoices = readStoredInvoices()
    return generateInvoiceNumber(
      invoices,
      invoicePrefix,
      invoicePadding,
      invoiceStartNumber,
      resetYearly,
      invoiceResetMonthDay,
      date
    )
  }, [date, invoicePadding, invoicePrefix, invoiceResetMonthDay, invoiceStartNumber, resetYearly])
  const duplicateCycleWarning = useMemo(() => {
    const invoices = readStoredInvoices()
    return getFirstRepeatedInvoiceNumberWarning(
      invoices,
      {
        prefix: invoicePrefix,
        padding: invoicePadding,
        startNumber: invoiceStartNumber,
        resetYearly,
        resetMonthDay: invoiceResetMonthDay,
      },
      date
    )
  }, [date, invoicePadding, invoicePrefix, invoiceResetMonthDay, invoiceStartNumber, resetYearly])

  function saveInvoice() {
    if (savingInvoice) return
    if (getAuthMode() === "supabase" && !isActiveUserKvHydrated()) {
      showAlert({
        tone: "info",
        title: "Syncing your account...",
        actionHint: "Wait a few seconds, then try your action again.",
        message: "easyBILL is still loading your saved data from the cloud.",
      })
      return
    }

    const allowance = canCreateAnotherInvoice()
    if (!allowance.ok) {
      showAlert({
        tone: "warning",
        title: "Invoice limit reached (Free plan)",
        actionHint: "Upgrade for unlimited invoices, or free up space by removing old drafts.",
        message: "You've reached the Free plan limit of 10 invoices. Upgrade to Plus to create more invoices.",
        primaryLabel: "Upgrade to Plus",
        secondaryLabel: "Not now",
        onPrimary: () => router.push("/dashboard/upgrade"),
      })
      return
    }

    const businessError = validateBusinessRecord(getStoredBusinessRecord())
    if (businessError) {
      showAlert({
        tone: "danger",
        title: "Business profile needs attention",
        actionHint: "Open Business Profile, complete the required details, then try creating the invoice again.",
        message: businessError,
      })
      return
    }

    const invoices = readStoredInvoices()
    const nextInvoiceNumber = generateInvoiceNumber(
      invoices,
      invoicePrefix,
      invoicePadding,
      invoiceStartNumber,
      resetYearly,
      invoiceResetMonthDay,
      date
    )
    const invoiceRecord = normalizeInvoiceRecord({
      id: createInvoiceId(),
      invoiceNumber: nextInvoiceNumber,
      ...getInvoiceNumberingMetadata(
        {
          prefix: invoicePrefix,
          padding: invoicePadding,
          startNumber: invoiceStartNumber,
          resetYearly,
          resetMonthDay: invoiceResetMonthDay,
        },
        date
      ),
      clientName,
      clientPhone,
      clientEmail,
      clientGST,
      clientAddress,
      date,
      customDetails,
      items,
      notes,
      status: "draft",
      history: [
        createInvoiceHistoryEntry("created", "Invoice created"),
        ...(duplicateSource ? [createInvoiceHistoryEntry("duplicated", `Duplicated from ${duplicateSource.invoiceNumber}`)] : []),
      ],
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

    if (invoices.length > 0) {
      const latestInvoice = invoices.reduce((latest, current) => {
        if (!latest) return current
        return new Date(current.date) > new Date(latest.date) ? current : latest
      }, null as (typeof invoices)[number] | null)
      if (latestInvoice && new Date(invoiceRecord.date) < new Date(latestInvoice.date)) {
        showAlert({
          tone: "warning",
          title: "Check the invoice date",
          actionHint: "Pick a date on or after your last invoice, then save again.",
          message: "Invoice date can't be earlier than the previous invoice date.",
        })
        return
      }
    }

    setSavingInvoice(true)
    invoices.push(invoiceRecord)
    writeStoredInvoices(invoices)
    bumpInvoiceUsageCount(1)

    showAlert({
      tone: "success",
      title: "Invoice saved",
      actionHint: "Open your list to view, print, or share the PDF.",
      message: "Your invoice is saved and ready to view, print, or download as PDF.",
      primaryLabel: "Go to invoices",
      onPrimary: () => router.push("/dashboard/invoices"),
    })
    window.setTimeout(() => setSavingInvoice(false), 800)
  }

  return (
    <div className="space-y-6 pb-24 xl:space-y-8 xl:pb-0">
      <InvoicePageHeader
        eyebrow="Create Invoice"
        title={duplicateSource ? `Duplicate ${duplicateSource.invoiceNumber}` : "Create a fresh invoice."}
        description={
          duplicateSource
            ? "Review the copied details, make any changes you need, and save to issue a new invoice number."
            : "Build a clean invoice with customer details, line items, taxes, and a ready-to-export PDF."
        }
        backLabel="Back to invoices"
        onBack={() => router.push("/dashboard/invoices")}
      />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
        <div className="soft-card rounded-[24px] px-4 py-3 sm:px-5 sm:py-4">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Invoice Number</p>
          <p className="mt-1.5 text-lg font-semibold text-slate-950 sm:mt-2 sm:text-2xl">{invoiceNumber}</p>
          {duplicateCycleWarning ? (
            <p className="mt-2 text-xs leading-5 text-amber-700">{duplicateCycleWarning}</p>
          ) : null}
        </div>
        <div className="soft-card rounded-[24px] px-4 py-3 sm:px-5 sm:py-4">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Subtotal</p>
          <p className="mt-1.5 text-lg font-semibold text-slate-950 sm:mt-2 sm:text-2xl">{money(subtotal)}</p>
        </div>
        <div className="soft-card rounded-[24px] px-4 py-3 sm:px-5 sm:py-4">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Taxes</p>
          <p className="mt-1.5 text-lg font-semibold text-slate-950 sm:mt-2 sm:text-2xl">{money(cgstTotal + sgstTotal + igstTotal)}</p>
        </div>
        <div className="rounded-[24px] bg-slate-950 px-4 py-3 text-white sm:px-5 sm:py-4">
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
            <p className="text-xs text-slate-500 sm:text-sm">Search existing clients quickly or add fresh billing details.</p>
          </div>
        </div>

        <div className="grid min-w-0 gap-3 sm:gap-4 lg:grid-cols-2 xl:grid-cols-[1.15fr_0.8fr_1.25fr_1fr_220px] [&>*]:min-w-0">
          <div className="relative min-w-0">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Client Name *</label>
            <input
              placeholder="Client Name"
              className="h-[54px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm leading-5 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              value={clientName}
              onChange={(e) => searchClientName(e.target.value)}
            />
            {clientField === "name" && clientSuggestions.length > 0 ? (
              <div ref={dropdownRef} className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                {clientSuggestions.map((customer, index) => (
                  <div key={`${customer.phone || customer.gst || customer.name}-${index}`} onClick={() => selectClient(customer)} className="cursor-pointer px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50">
                    {customer.name} ({customer.phone || `GSTIN: ${customer.gst || "Not added yet"}`})
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="relative min-w-0">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Client Phone</label>
            <input
              placeholder="Client Phone"
              className="h-[54px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm leading-5 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              value={clientPhone}
              onChange={(e) => searchClientPhone(e.target.value)}
            />
            {clientField === "phone" && clientSuggestions.length > 0 ? (
              <div ref={dropdownRef} className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                {clientSuggestions.map((customer, index) => (
                  <div key={`${customer.phone || customer.gst || customer.name}-${index}`} onClick={() => selectClient(customer)} className="cursor-pointer px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50">
                    {customer.name} ({customer.phone || `GSTIN: ${customer.gst || "Not added yet"}`})
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="min-w-0">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Client Email</label>
            <input placeholder="Client Email" className="h-[54px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm leading-5 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
          </div>
          <div className="min-w-0">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Client GSTIN</label>
            <input placeholder="Client GSTIN" className="h-[54px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm leading-5 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" value={clientGST} onChange={(e) => setClientGST(e.target.value)} />
          </div>
          <div className="min-w-0">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Invoice Date *</label>
            <input
              type="date"
              className="eb-date-input box-border h-[54px] w-full max-w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm leading-5 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:gap-4 xl:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Client Address</label>
            <div className="rounded-[24px] border border-slate-200 bg-white p-4">
              <textarea placeholder="Client Address" className="min-h-[148px] w-full resize-none bg-transparent px-0 py-0 text-sm outline-none transition placeholder:text-slate-400 focus:border-transparent focus:ring-0" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Custom Details</label>
            <div className="rounded-[24px] border border-slate-200 bg-white p-4">
              <div className="mb-3 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
                <p className="text-sm text-slate-500">Optional details like project name or work type.</p>
                <button onClick={addCustomDetail} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 sm:w-auto sm:rounded-full sm:py-2">
                  <CirclePlus className="h-4 w-4" />
                  Add Detail
                </button>
              </div>

              <div className="space-y-3">
                {customDetails.map((detail, index) => (
                  <div key={index} className="grid gap-3 md:grid-cols-[0.35fr_1fr_auto]">
                    <input
                      placeholder="Label"
                      className="h-[54px] rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm leading-5 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                      value={detail.label}
                      onChange={(e) => setCustomDetails((prev) => prev.map((row, current) => (current === index ? { ...row, label: e.target.value } : row)))}
                    />
                    <input
                      placeholder="Value"
                      className="h-[54px] rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm leading-5 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                      value={detail.value}
                      onChange={(e) => setCustomDetails((prev) => prev.map((row, current) => (current === index ? { ...row, value: e.target.value } : row)))}
                    />
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
            <p className="text-xs text-slate-500 sm:text-sm">Fast mobile entry for products, tax, and totals.</p>
          </div>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="rounded-[24px] border border-slate-200 bg-white p-3 sm:rounded-[26px] sm:p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Item {index + 1}</p>
                <button onClick={() => removeProduct(index)} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100" aria-label={`Remove item ${index + 1}`}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-[1.7fr_0.95fr_0.62fr_0.7fr_0.9fr_0.68fr_0.68fr_0.68fr_1fr_auto]">
                <div className="relative col-span-2">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Product *</label>
                  <input value={item.product} onChange={(e) => searchProduct(index, e.target.value)} placeholder="Product" className="h-[54px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm leading-5 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" />
                  {activeRow === index && suggestions.length > 0 ? (
                    <div ref={dropdownRef} className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                      {suggestions.map((product, suggestionIndex) => (
                        <div key={`${product.hsn}-${suggestionIndex}`} onClick={() => selectSuggestion(product)} className="cursor-pointer px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50">
                          {product.name} ({product.hsn})
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">HSN</label>
                  <input value={item.hsn} onChange={(e) => searchHSN(index, e.target.value)} placeholder="HSN" className="h-[54px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm leading-5 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" />
                </div>

                {(["qty", "unit", "price", "cgst", "sgst", "igst"] as const).map((field) => (
                  <div key={field}>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{field === "qty" ? "Qty *" : field === "unit" ? "Unit" : `${field.toUpperCase()}${field === "price" ? " *" : " %"}`}</label>
                    <input
                      type={field === "unit" ? "text" : "text"}
                      inputMode={field === "unit" ? undefined : "decimal"}
                      value={String(item[field] ?? "")}
                      onChange={(e) => {
                        const next = e.target.value
                        if (field === "unit") {
                          handleItemChange(index, field, next)
                          return
                        }
                        // Keep numeric typing smooth (e.g. "1.", "0.5", "0,5") while blocking invalid characters.
                        if (!/^\d*([.,]?\d*)$/.test(next)) return
                        handleItemChange(index, field, next)
                      }}
                      placeholder={field === "unit" ? "Unit" : field.toUpperCase()}
                      className="h-[54px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm leading-5 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>
                ))}

                <div className="col-span-2 sm:col-span-1">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Total</label>
                  <div className="flex items-center rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900">{money(Number(item.total || 0))}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={addProduct} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 sm:w-auto">
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </section>

      <section className="soft-card rounded-[24px] p-4 sm:p-6 xl:rounded-[28px]">
        <h2 className="section-title text-xl sm:text-2xl">Invoice Summary</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-[24px] border border-slate-200 bg-white p-5 text-sm text-slate-600">
            <div className="flex justify-between"><span>Subtotal</span><span className="font-semibold text-slate-900">{money(subtotal)}</span></div>
            <div className="flex justify-between"><span>CGST Total</span><span className="font-semibold text-slate-900">{money(cgstTotal)}</span></div>
            <div className="flex justify-between"><span>SGST Total</span><span className="font-semibold text-slate-900">{money(sgstTotal)}</span></div>
            <div className="flex justify-between"><span>IGST Total</span><span className="font-semibold text-slate-900">{money(igstTotal)}</span></div>
          </div>
          <div className="rounded-[24px] bg-slate-950 p-6 text-white">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Grand Total</p>
            <p className="mt-3 text-3xl font-semibold sm:text-4xl">{money(grandTotal)}</p>
          </div>
        </div>

        <button onClick={saveInvoice} disabled={savingInvoice} className="mt-5 hidden items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 xl:inline-flex">
          <Save className="h-4 w-4" />
          {savingInvoice ? "Saving..." : "Save Invoice"}
        </button>
      </section>

      <div className="eb-safe-bottom-pad fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 px-4 pt-3 shadow-[0_-12px_40px_rgba(15,23,42,0.08)] backdrop-blur-md xl:hidden">
        <button onClick={saveInvoice} disabled={savingInvoice} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400">
          <Save className="h-4 w-4" />
          {savingInvoice ? "Saving..." : "Save Invoice"}
        </button>
      </div>
    </div>
  )
}

