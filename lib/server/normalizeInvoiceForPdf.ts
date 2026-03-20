/**
 * SaaS-style integrity: PDFs are generated from server-loaded data.
 * Recompute per-line `total` from qty × price and tax rates so stored rows stay consistent
 * (guards against drift or partial writes) before seeding the print document.
 */
export function normalizeInvoiceForPdf<T extends Record<string, unknown>>(invoice: T): T {
  let raw: T
  try {
    raw = JSON.parse(JSON.stringify(invoice)) as T
  } catch {
    return invoice
  }

  const rawItems = (raw as unknown as { items?: unknown }).items
  const items = Array.isArray(rawItems)
    ? ([...rawItems] as Record<string, unknown>[])
    : []

  const nextItems = items.map((item) => {
    const qty = Number(item.qty) || 0
    const price = Number(item.price) || 0
    const cgst = Number(item.cgst) || 0
    const sgst = Number(item.sgst) || 0
    const igst = Number(item.igst) || 0
    const base = qty * price
    const total = base + (base * cgst) / 100 + (base * sgst) / 100 + (base * igst) / 100
    return { ...item, qty, price, cgst, sgst, igst, total }
  })

  return { ...raw, items: nextItems } as T
}
