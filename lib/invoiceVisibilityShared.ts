/** Shared between client settings and server PDF — must stay free of `"use client"`. */

export type InvoiceVisibilitySettings = {
  businessName: boolean
  businessAddress: boolean
  businessPhone: boolean
  businessGstin: boolean
  businessTerms: boolean
  businessBankDetails: boolean
  businessLogo: boolean
  clientName: boolean
  clientAddress: boolean
  clientPhone: boolean
  clientGstin: boolean
}

export const DEFAULT_INVOICE_VISIBILITY: InvoiceVisibilitySettings = {
  businessName: true,
  businessAddress: true,
  businessPhone: true,
  businessGstin: true,
  businessTerms: true,
  businessBankDetails: true,
  businessLogo: true,
  clientName: true,
  clientAddress: true,
  clientPhone: true,
  clientGstin: true,
}
