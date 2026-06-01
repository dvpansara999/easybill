export const CUSTOMER_MODEL_KIND = "invoice-derived" as const

export type CustomerModelKind = typeof CUSTOMER_MODEL_KIND

export const CUSTOMER_MODEL = {
  kind: CUSTOMER_MODEL_KIND,
  authoritativeSource: "invoices",
  persistenceRole: "lookup-cache",
  editableSurface: "invoice-customer-fields",
  routeCompatibility: "hash-safe-with-legacy-fallback",
} as const

export function isInvoiceDerivedCustomerModel() {
  return CUSTOMER_MODEL.kind === "invoice-derived"
}

