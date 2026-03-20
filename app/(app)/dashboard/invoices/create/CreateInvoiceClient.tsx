"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSettings } from "@/context/SettingsContext"
import { formatCurrency } from "@/lib/formatCurrency"
import { generateInvoiceNumber } from "@/lib/invoiceNumber"
import { getActiveOrGlobalItem, setActiveOrGlobalItem } from "@/lib/userStore"
import { bumpInvoiceUsageCount, canCreateAnotherInvoice } from "@/lib/plans"
import { useAppAlert } from "@/components/providers/AppAlertProvider"
import { getAuthMode } from "@/lib/runtimeMode"
import { isActiveUserKvHydrated } from "@/lib/userStore"
import {
  createEmptyInvoiceItem,
  getStoredBusinessRecord,
  normalizeInvoiceRecord,
  validateBusinessRecord,
  validateInvoiceRecord,
} from "@/lib/invoice"
import { ArrowLeft, CirclePlus, Package2, Plus, Save, Trash2, UserRound } from "lucide-react"

export default function CreateInvoiceClient() {
  const {
    invoicePrefix,
    invoicePadding,
    invoiceStartNumber,
    resetYearly,
    amountFormat,
    showDecimals,
    currencySymbol,
    currencyPosition,
  } = useSettings()

  const router = useRouter()
  const searchParams = useSearchParams()
  const { showAlert } = useAppAlert()

  const [products, setProducts] = useState<any[]>([])
  const [items, setItems] = useState<any[]>([])
  const [invoiceNumber, setInvoiceNumber] = useState("")

  const [clientName, setClientName] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [clientGST, setClientGST] = useState("")
  const [clientAddress, setClientAddress] = useState("")
  const [date, setDate] = useState("")

  const [customDetails, setCustomDetails] = useState<any[]>([])

  const [suggestions, setSuggestions] = useState<any[]>([])
  const [activeRow, setActiveRow] = useState<number | null>(null)

  const [customers, setCustomers] = useState<any[]>([])
  const [clientSuggestions, setClientSuggestions] = useState<any[]>([])
  const [clientField, setClientField] = useState("")

  const dropdownRef = useRef<HTMLDivElement>(null)

  function money(value: number) {
    return formatCurrency(value, currencySymbol, currencyPosition, showDecimals, amountFormat)
  }

  useEffect(() => {
    const savedProducts = getActiveOrGlobalItem("products")
    if (savedProducts) setProducts(JSON.parse(savedProducts))

    const savedInvoices = getActiveOrGlobalItem("invoices")

    if (savedInvoices) {
      const parsed = JSON.parse(savedInvoices)

      const newNumber = generateInvoiceNumber(
        parsed,
        invoicePrefix,
        invoicePadding,
        invoiceStartNumber,
        resetYearly
      )

      setInvoiceNumber(newNumber)

      const map: any = {}

      parsed.forEach((inv: any) => {
        if (!inv.clientPhone) return

        map[inv.clientPhone] = {
          name: inv.clientName,
          phone: inv.clientPhone,
          email: inv.clientEmail,
          gst: inv.clientGST,
          address: inv.clientAddress,
        }
      })

      setCustomers(Object.values(map))
    } else {
      setInvoiceNumber(`${invoicePrefix}${String(invoiceStartNumber).padStart(invoicePadding, "0")}`)
    }

    setItems([createEmptyInvoiceItem()])
  }, [])

  useEffect(() => {
    const name = searchParams.get("name")
    const phone = searchParams.get("phone")
    const email = searchParams.get("email")
    const gst = searchParams.get("gstin")
    const address = searchParams.get("address")

    if (name) setClientName(name)
    if (phone) setClientPhone(phone)
    if (email) setClientEmail(email)
    if (gst) setClientGST(gst)
    if (address) setClientAddress(address)
  }, [searchParams])

  useEffect(() => {
    function handleClickOutside(e: any) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setSuggestions([])
        setClientSuggestions([])
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function searchClientName(value: string) {
    setClientName(value)
    setClientField("name")

    const matches = customers.filter((c: any) => c.name?.toLowerCase().includes(value.toLowerCase()))

    setClientSuggestions(matches)
  }

  function searchClientPhone(value: string) {
    setClientPhone(value)
    setClientField("phone")

    const matches = customers.filter((c: any) => String(c.phone).includes(value))

    setClientSuggestions(matches)
  }

  function selectClient(c: any) {
    setClientName(c.name || "")
    setClientPhone(c.phone || "")
    setClientEmail(c.email || "")
    setClientGST(c.gst || "")
    setClientAddress(c.address || "")
    setClientSuggestions([])
  }

  function updateTotals(updated: any[], index: number) {
    const qty = Number(updated[index].qty)
    const price = Number(updated[index].price)
    const base = qty * price
    const cgst = base * (updated[index].cgst / 100)
    const sgst = base * (updated[index].sgst / 100)
    const igst = base * (updated[index].igst / 100)

    updated[index].total = base + cgst + sgst + igst

    return updated
  }

  function handleItemChange(index: number, field: string, value: any) {
    const updated = [...items]
    updated[index][field] = value

    updateTotals(updated, index)
    setItems(updated)
  }

  function searchProduct(index: number, value: string) {
    setActiveRow(index)

    const matches = products.filter((p: any) => p.name.toLowerCase().includes(value.toLowerCase()))

    setSuggestions(matches)
    handleItemChange(index, "product", value)
  }

  function searchHSN(index: number, value: string) {
    setActiveRow(index)

    const matches = products.filter((p: any) => String(p.hsn).includes(value))

    setSuggestions(matches)
    handleItemChange(index, "hsn", value)
  }

  function selectSuggestion(product: any) {
    if (activeRow === null) return

    const updated = [...items]

    updated[activeRow].product = product.name
    updated[activeRow].hsn = product.hsn
    updated[activeRow].unit = product.unit
    updated[activeRow].price = product.price
    updated[activeRow].cgst = product.cgst
    updated[activeRow].sgst = product.sgst
    updated[activeRow].igst = product.igst

    updateTotals(updated, activeRow)

    setItems(updated)
    setSuggestions([])
  }

  function addProduct() {
    setItems([...items, createEmptyInvoiceItem()])
  }

  function removeProduct(index: number) {
    const updated = [...items]
    updated.splice(index, 1)
    setItems(updated)
  }

  function addCustomDetail() {
    setCustomDetails([...customDetails, { label: "", value: "" }])
  }

  function removeCustomDetail(index: number) {
    const updated = [...customDetails]
    updated.splice(index, 1)
    setCustomDetails(updated)
  }

  const subtotal = items.reduce((sum, i) => sum + i.qty * i.price, 0)
  const cgstTotal = items.reduce((sum, i) => sum + i.qty * i.price * (i.cgst / 100), 0)
  const sgstTotal = items.reduce((sum, i) => sum + i.qty * i.price * (i.sgst / 100), 0)
  const igstTotal = items.reduce((sum, i) => sum + i.qty * i.price * (i.igst / 100), 0)
  const grandTotal = subtotal + cgstTotal + sgstTotal + igstTotal

  function saveInvoice() {
    if (getAuthMode() === "supabase" && !isActiveUserKvHydrated()) {
      showAlert({
        tone: "info",
        title: "Syncing your account…",
        message: "Please wait a moment while easyBILL loads your saved data from the cloud, then try again.",
        primaryLabel: "OK",
      })
      return
    }
    const allowance = canCreateAnotherInvoice()
    if (!allowance.ok) {
      showAlert({
        tone: "warning",
        title: "Invoice limit reached (Free plan)",
        message:
          "You’ve reached the Free plan limit of 10 invoices. Upgrade to Plus to create more invoices.",
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
        message: businessError,
        primaryLabel: "OK",
      })
      return
    }

    const saved = getActiveOrGlobalItem("invoices")
    const invoices = saved ? JSON.parse(saved) : []

    const invoiceRecord = normalizeInvoiceRecord({
      invoiceNumber,
      clientName,
      clientPhone,
      clientEmail,
      clientGST,
      clientAddress,
      date,
      customDetails,
      items,
      grandTotal,
    })

    const invoiceError = validateInvoiceRecord(invoiceRecord)

    if (invoiceError) {
      showAlert({
        tone: "danger",
        title: "Missing or invalid invoice details",
        message: invoiceError,
        primaryLabel: "OK",
      })
      return
    }

    if (invoices.length > 0) {
      const lastInvoice = invoices[invoices.length - 1]

      if (new Date(invoiceRecord.date) < new Date(lastInvoice.date)) {
        showAlert({
          tone: "warning",
          title: "Check the invoice date",
          message: "Invoice date can’t be earlier than the previous invoice date.",
          primaryLabel: "OK",
        })
        return
      }
    }

    invoices.push(invoiceRecord)
    setActiveOrGlobalItem("invoices", JSON.stringify(invoices))
    bumpInvoiceUsageCount(1)

    showAlert({
      tone: "success",
      title: "Invoice saved",
      message: "Your invoice is saved and ready to view, print, or download as PDF.",
      primaryLabel: "Go to invoices",
      onPrimary: () => router.push("/dashboard/invoices"),
    })
  }

  function goBackToInvoices() {
    router.push("/dashboard/invoices")
  }

  return (
    <div className="space-y-6 pb-24 xl:space-y-8 xl:pb-0">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <button
            onClick={goBackToInvoices}
            className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 sm:mb-5 sm:w-auto sm:justify-start sm:rounded-full sm:py-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <p className="text-xs uppercase tracking-[0.34em] text-emerald-700">Create Invoice</p>
        </div>
      </section>

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

        <div className="grid gap-3 sm:gap-4 lg:grid-cols-2 xl:grid-cols-[1.15fr_0.8fr_1.25fr_1fr_220px]">
          <div className="relative">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Client Name *</label>
            <input
              placeholder="Client Name"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              value={clientName}
              onChange={(e) => searchClientName(e.target.value)}
            />

            {clientField === "name" && clientSuggestions.length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
              >
                {clientSuggestions.map((c: any, i: number) => (
                  <div
                    key={i}
                    onClick={() => selectClient(c)}
                    className="cursor-pointer px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50"
                  >
                    {c.name} ({c.phone})
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Client Phone</label>
            <input
              placeholder="Client Phone"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              value={clientPhone}
              onChange={(e) => searchClientPhone(e.target.value)}
            />

            {clientField === "phone" && clientSuggestions.length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
              >
                {clientSuggestions.map((c: any, i: number) => (
                  <div
                    key={i}
                    onClick={() => selectClient(c)}
                    className="cursor-pointer px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50"
                  >
                    {c.name} ({c.phone})
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Client Email</label>
            <input
              placeholder="Client Email"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Client GSTIN</label>
            <input
              placeholder="Client GSTIN"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              value={clientGST}
              onChange={(e) => setClientGST(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Invoice Date *</label>
            <input
              type="date"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:gap-4 xl:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Client Address</label>
            <div className="rounded-[24px] border border-slate-200 bg-white p-4">
              <textarea
                placeholder="Client Address"
                className="min-h-[148px] w-full resize-none bg-transparent px-0 py-0 text-sm outline-none transition placeholder:text-slate-400 focus:border-transparent focus:ring-0"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Custom Details</label>
            <div className="rounded-[24px] border border-slate-200 bg-white p-4">
              <div className="mb-3 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
                <p className="text-sm text-slate-500">Optional details like project name or work type.</p>
                <button
                  onClick={addCustomDetail}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 sm:w-auto sm:rounded-full sm:py-2"
                >
                  <CirclePlus className="h-4 w-4" />
                  Add Detail
                </button>
              </div>

              <div className="space-y-3">
                {customDetails.map((d, i) => (
                  <div key={i} className="grid gap-3 md:grid-cols-[0.35fr_1fr_auto]">
                    <input
                      placeholder="Label"
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                      value={d.label}
                      onChange={(e) => {
                        const updated = [...customDetails]
                        updated[i].label = e.target.value
                        setCustomDetails(updated)
                      }}
                    />

                    <input
                      placeholder="Value"
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                      value={d.value}
                      onChange={(e) => {
                        const updated = [...customDetails]
                        updated[i].value = e.target.value
                        setCustomDetails(updated)
                      }}
                    />

                    <button
                      onClick={() => removeCustomDetail(i)}
                      className="inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-600 transition hover:bg-rose-100"
                    >
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
                  <input
                    value={item.product}
                    onChange={(e) => searchProduct(index, e.target.value)}
                    placeholder="Product"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />

                  {activeRow === index && suggestions.length > 0 && (
                    <div
                      ref={dropdownRef}
                      className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
                    >
                      {suggestions.map((s: any, i: number) => (
                        <div
                          key={i}
                          onClick={() => selectSuggestion(s)}
                          className="cursor-pointer px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50"
                        >
                          {s.name} ({s.hsn})
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">HSN</label>
                  <input
                    value={item.hsn}
                    onChange={(e) => searchHSN(index, e.target.value)}
                    placeholder="HSN"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Qty *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={item.qty}
                    onChange={(e) => handleItemChange(index, "qty", e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Qty"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Unit</label>
                  <input
                    value={item.unit}
                    onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                    placeholder="Unit"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Price *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={item.price}
                    onChange={(e) => handleItemChange(index, "price", e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Price"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">CGST %</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={item.cgst}
                    onChange={(e) => handleItemChange(index, "cgst", e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="CGST"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">SGST %</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={item.sgst}
                    onChange={(e) => handleItemChange(index, "sgst", e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="SGST"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">IGST %</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={item.igst}
                    onChange={(e) => handleItemChange(index, "igst", e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="IGST"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Total</label>
                  <div className="flex items-center rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900">
                    {money(item.total)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addProduct}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </section>

      <section className="soft-card rounded-[24px] p-4 sm:p-6 xl:rounded-[28px]">
        <h2 className="section-title text-xl sm:text-2xl">Invoice Summary</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-[24px] border border-slate-200 bg-white p-5 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">{money(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>CGST Total</span>
              <span className="font-semibold text-slate-900">{money(cgstTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>SGST Total</span>
              <span className="font-semibold text-slate-900">{money(sgstTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>IGST Total</span>
              <span className="font-semibold text-slate-900">{money(igstTotal)}</span>
            </div>
          </div>

          <div className="rounded-[24px] bg-slate-950 p-6 text-white">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Grand Total</p>
            <p className="mt-3 text-3xl font-semibold sm:text-4xl">{money(grandTotal)}</p>
          </div>
        </div>

        <button
          onClick={saveInvoice}
          className="mt-5 hidden items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 xl:inline-flex"
        >
          <Save className="h-4 w-4" />
          Save Invoice
        </button>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(15,23,42,0.08)] backdrop-blur-md xl:hidden">
        <button
          onClick={saveInvoice}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <Save className="h-4 w-4" />
          Save Invoice
        </button>
      </div>
    </div>
  )
}

