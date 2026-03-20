type InvoiceNumberSource = {
  invoiceNumber?: string
  date?: string
}

export function generateInvoiceNumber(
  invoices: InvoiceNumberSource[],
  prefix: string,
  padding: number,
  startNumber: number,
  resetYearly: boolean
) {
  const currentYear = new Date().getFullYear()

  const filtered = resetYearly
    ? invoices.filter((invoice) => new Date(invoice.date || "").getFullYear() === currentYear)
    : invoices

  let maxNumber = startNumber - 1

  filtered.forEach((invoice) => {
    const numericPart = Number(String(invoice.invoiceNumber || "").replace(/\D/g, ""))
    if (numericPart > maxNumber) {
      maxNumber = numericPart
    }
  })

  return `${prefix}${String(maxNumber + 1).padStart(padding, "0")}`
}
