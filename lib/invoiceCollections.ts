import type { InvoiceRecord } from "@/lib/invoice"

export type CustomerRow = {
  name: string
  phone: string
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
    const name = invoice.clientName || "Unknown"
    const phone = invoice.clientPhone || "no-phone"
    const revenue = Number(invoice.grandTotal || 0)

    if (!map[phone]) {
      map[phone] = {
        name,
        phone,
        invoices: 0,
        revenue: 0,
        latestDate: "",
        latestInvoiceNumber: "",
      }
    }

    map[phone].invoices += 1
    map[phone].revenue += revenue

    const currentLatestTime = map[phone].latestDate ? new Date(map[phone].latestDate).getTime() : 0
    const incomingTime = invoice.date ? new Date(invoice.date).getTime() : 0
    const currentLatestNumber = Number(String(map[phone].latestInvoiceNumber || "").replace(/\D/g, ""))
    const incomingNumber = Number(String(invoice.invoiceNumber || "").replace(/\D/g, ""))

    if (incomingTime > currentLatestTime || (incomingTime === currentLatestTime && incomingNumber > currentLatestNumber)) {
      map[phone].latestDate = invoice.date || ""
      map[phone].latestInvoiceNumber = invoice.invoiceNumber || ""
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
