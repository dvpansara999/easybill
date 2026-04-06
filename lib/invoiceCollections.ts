import type { InvoiceRecord } from "@/lib/invoice"
import { buildCustomerIdentity, normalizeCustomerGstin, normalizeCustomerPhone } from "@/lib/customerIdentity"

export type CustomerRow = {
  identity: string
  name: string
  phone: string
  gstin: string
  invoices: number
  revenue: number
  latestDate: string
  latestInvoiceNumber: string
}

export function parseInvoiceNumber(invoiceNumber: string) {
  const match = invoiceNumber.match(/^(.*?)(\d+)$/)

  if (!match) {
    return {
      prefix: invoiceNumber,
      numericValue: null,
      numericText: "",
    }
  }

  return {
    prefix: match[1],
    numericValue: Number(match[2]),
    numericText: match[2],
  }
}

export function compareInvoicesNewestFirst(a: InvoiceRecord, b: InvoiceRecord) {
  const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime()
  if (dateDiff !== 0) return dateDiff

  const aNum = Number(String(a.invoiceNumber || "").replace(/\D/g, ""))
  const bNum = Number(String(b.invoiceNumber || "").replace(/\D/g, ""))
  return bNum - aNum
}

export function sortInvoicesNewestFirst(invoices: InvoiceRecord[]) {
  return [...invoices].sort(compareInvoicesNewestFirst)
}

export function buildInvoiceRangeSummary(invoices: InvoiceRecord[]) {
  if (invoices.length === 0) return []

  const chronological = [...invoices].reverse()
  const groups: Array<{
    prefix: string
    firstLabel: string
    lastLabel: string
    firstValue: number | null
    lastValue: number | null
    width: number
  }> = []

  chronological.forEach((invoice) => {
    const parsed = parseInvoiceNumber(invoice.invoiceNumber || "")
    const lastGroup = groups[groups.length - 1]

    if (!lastGroup || lastGroup.prefix !== parsed.prefix) {
      groups.push({
        prefix: parsed.prefix,
        firstLabel: invoice.invoiceNumber || "",
        lastLabel: invoice.invoiceNumber || "",
        firstValue: parsed.numericValue,
        lastValue: parsed.numericValue,
        width: parsed.numericText.length,
      })
      return
    }

    lastGroup.lastLabel = invoice.invoiceNumber || ""
    lastGroup.lastValue = parsed.numericValue
    lastGroup.width = Math.max(lastGroup.width, parsed.numericText.length)
  })

  return groups.map((group) => {
    if (group.firstValue === null || group.lastValue === null) {
      return group.firstLabel === group.lastLabel ? group.firstLabel : `${group.firstLabel} to ${group.lastLabel}`
    }

    const start = String(group.firstValue).padStart(group.width, "0")
    const end = String(group.lastValue).padStart(group.width, "0")
    return start === end ? `${group.prefix}${start}` : `${group.prefix}${start} to ${group.prefix}${end}`
  })
}

export function buildCustomerRows(invoices: InvoiceRecord[]): CustomerRow[] {
  const map: Record<string, CustomerRow> = {}

  invoices.forEach((invoice) => {
    const identity = buildCustomerIdentity(invoice)
    const name = invoice.clientName || "Unknown"
    const phone = normalizeCustomerPhone(invoice.clientPhone)
    const gstin = normalizeCustomerGstin(invoice.clientGST)
    const revenue = Number(invoice.grandTotal || 0)

    if (!map[identity.id]) {
      map[identity.id] = {
        identity: identity.id,
        name,
        phone,
        gstin,
        invoices: 0,
        revenue: 0,
        latestDate: "",
        latestInvoiceNumber: "",
      }
    }

    map[identity.id].invoices += 1
    map[identity.id].revenue += revenue
    if (!map[identity.id].phone && phone) map[identity.id].phone = phone
    if (!map[identity.id].gstin && gstin) map[identity.id].gstin = gstin
    if ((!map[identity.id].name || map[identity.id].name === "Unknown") && name) {
      map[identity.id].name = name
    }

    const currentLatestTime = map[identity.id].latestDate ? new Date(map[identity.id].latestDate).getTime() : 0
    const incomingTime = invoice.date ? new Date(invoice.date).getTime() : 0
    const currentLatestNumber = Number(String(map[identity.id].latestInvoiceNumber || "").replace(/\D/g, ""))
    const incomingNumber = Number(String(invoice.invoiceNumber || "").replace(/\D/g, ""))

    if (incomingTime > currentLatestTime || (incomingTime === currentLatestTime && incomingNumber > currentLatestNumber)) {
      map[identity.id].latestDate = invoice.date || ""
      map[identity.id].latestInvoiceNumber = invoice.invoiceNumber || ""
      map[identity.id].name = name || map[identity.id].name
      map[identity.id].phone = phone || map[identity.id].phone
      map[identity.id].gstin = gstin || map[identity.id].gstin
    }
  })

  return Object.values(map).sort((a, b) => {
    const dateDiff = new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime()
    if (dateDiff !== 0) return dateDiff

    const aNum = Number(String(a.latestInvoiceNumber || "").replace(/\D/g, ""))
    const bNum = Number(String(b.latestInvoiceNumber || "").replace(/\D/g, ""))
    return bNum - aNum
  })
}
