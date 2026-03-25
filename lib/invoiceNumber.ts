type InvoiceNumberSource = {
  invoiceNumber?: string
  date?: string
}

type DateParts = {
  year: number
  month: number
  day: number
}

function parseStoredDate(value: string | undefined): DateParts | null {
  if (!value) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null
  if (month < 1 || month > 12) return null
  if (day < 1 || day > 31) return null

  return { year, month, day }
}

function getTodayDateParts(): DateParts {
  const today = new Date()
  return {
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    day: today.getDate(),
  }
}

function compareDateParts(left: DateParts, right: DateParts) {
  if (left.year !== right.year) return left.year - right.year
  if (left.month !== right.month) return left.month - right.month
  return left.day - right.day
}

function getCycleBounds(resetMonthDay: string, referenceDate: DateParts) {
  const [resetMonthRaw, resetDayRaw] = resetMonthDay.split("-")
  const resetMonth = Number(resetMonthRaw)
  const resetDay = Number(resetDayRaw)

  const resetPointThisYear = {
    year: referenceDate.year,
    month: resetMonth,
    day: resetDay,
  }

  const startYear = compareDateParts(referenceDate, resetPointThisYear) >= 0 ? referenceDate.year : referenceDate.year - 1

  return {
    start: { year: startYear, month: resetMonth, day: resetDay },
    end: { year: startYear + 1, month: resetMonth, day: resetDay },
  }
}

function extractInvoiceNumericPart(invoiceNumber: string, prefix: string) {
  if (!invoiceNumber.startsWith(prefix)) return null
  const suffix = invoiceNumber.slice(prefix.length)
  if (!/^\d+$/.test(suffix)) return null
  return Number(suffix)
}

export function generateInvoiceNumber(
  invoices: InvoiceNumberSource[],
  prefix: string,
  padding: number,
  startNumber: number,
  resetYearly: boolean,
  resetMonthDay = "01-01",
  referenceDate = ""
) {
  const parsedReferenceDate = parseStoredDate(referenceDate) ?? getTodayDateParts()
  const cycle = getCycleBounds(resetMonthDay, parsedReferenceDate)

  const filtered = resetYearly
    ? invoices.filter((invoice) => {
        const parsedDate = parseStoredDate(invoice.date)
        if (!parsedDate) return false
        return compareDateParts(parsedDate, cycle.start) >= 0 && compareDateParts(parsedDate, cycle.end) < 0
      })
    : invoices

  let maxNumber = startNumber - 1

  filtered.forEach((invoice) => {
    const numericPart = extractInvoiceNumericPart(String(invoice.invoiceNumber || ""), prefix)
    if (numericPart == null) return
    if (numericPart > maxNumber) {
      maxNumber = numericPart
    }
  })

  return `${prefix}${String(maxNumber + 1).padStart(padding, "0")}`
}
