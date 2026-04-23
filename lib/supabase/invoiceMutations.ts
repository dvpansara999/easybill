"use client"

import { createSupabaseBrowserClient } from "@/lib/supabase/browser"
import { refreshInvoicesFromSupabase } from "@/lib/supabase/userKvSync"
import { getAuthMode } from "@/lib/runtimeMode"
import type { PostgrestError } from "@supabase/supabase-js"
import {
  createInvoiceHistoryEntry,
  normalizeInvoiceRecord,
  readStoredInvoices,
  replaceInvoiceById,
  writeStoredInvoices,
  type InvoiceRecord,
} from "@/lib/invoice"

function toRpcPayload(invoice: InvoiceRecord, options?: { duplicateSourceInvoiceNumber?: string }) {
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    createdAt: invoice.createdAt,
    numberingModeAtCreation: invoice.numberingModeAtCreation,
    resetMonthDayAtCreation: invoice.resetMonthDayAtCreation,
    sequenceWindowStart: invoice.sequenceWindowStart,
    sequenceWindowEnd: invoice.sequenceWindowEnd,
    clientName: invoice.clientName,
    clientPhone: invoice.clientPhone,
    clientEmail: invoice.clientEmail,
    clientGST: invoice.clientGST,
    clientAddress: invoice.clientAddress,
    date: invoice.date,
    customDetails: invoice.customDetails,
    items: (invoice.items || []).map((item, index) => ({
      position: index,
      product: item.product,
      hsn: item.hsn,
      qty: item.qty,
      unit: item.unit,
      price: item.price,
      cgst: item.cgst,
      sgst: item.sgst,
      igst: item.igst,
      total: item.total,
    })),
    notes: invoice.notes || "",
    status: invoice.status || "draft",
    grandTotal: invoice.grandTotal,
    duplicateSourceInvoiceNumber: options?.duplicateSourceInvoiceNumber || null,
  }
}

function mapMutationError(error: PostgrestError | null) {
  const rawMessage = error?.message || "Database operation failed."
  const normalized = rawMessage.toLowerCase()
  const missingCreateRpc =
    normalized.includes("create_invoice_record") &&
    (normalized.includes("could not find the function") ||
      normalized.includes("does not exist") ||
      error?.code === "PGRST202" ||
      error?.code === "42883")
  const missingUpdateRpc =
    normalized.includes("update_invoice_record") &&
    (normalized.includes("could not find the function") ||
      normalized.includes("does not exist") ||
      error?.code === "PGRST202" ||
      error?.code === "42883")
  const missingDeleteRpc =
    normalized.includes("delete_invoice_record") &&
    (normalized.includes("could not find the function") ||
      normalized.includes("does not exist") ||
      error?.code === "PGRST202" ||
      error?.code === "42883")

  if (missingCreateRpc || missingUpdateRpc || missingDeleteRpc) {
    return "Your Supabase project is still using the old schema. Run D:/Projects/invoice-app/supabase/schema.sql in the Supabase SQL editor, then reload the app."
  }

  if (normalized.includes("relation") && normalized.includes("does not exist")) {
    return "Your Supabase project is missing the new relational tables. Run D:/Projects/invoice-app/supabase/schema.sql in the Supabase SQL editor, then reload the app."
  }

  return rawMessage
}

export async function syncInvoicesCacheFromSupabase() {
  if (getAuthMode() !== "supabase") return readStoredInvoices()
  const supabase = createSupabaseBrowserClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return readStoredInvoices()
  const invoices = await refreshInvoicesFromSupabase(supabase, user.id)
  writeStoredInvoices(invoices)
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("easybill:kv-write", { detail: { key: "invoices" } }))
  }
  return invoices
}

export async function createInvoiceViaSupabase(
  invoice: InvoiceRecord,
  options?: { duplicateSourceInvoiceNumber?: string }
) {
  if (getAuthMode() !== "supabase") {
    const invoices = readStoredInvoices()
    const nextInvoice = normalizeInvoiceRecord({
      ...invoice,
      history: [
        createInvoiceHistoryEntry("created", "Invoice created"),
        ...(options?.duplicateSourceInvoiceNumber
          ? [createInvoiceHistoryEntry("duplicated", `Duplicated from ${options.duplicateSourceInvoiceNumber}`)]
          : []),
      ],
    })
    invoices.push(nextInvoice)
    writeStoredInvoices(invoices)
    return nextInvoice
  }

  const supabase = createSupabaseBrowserClient()
  const payload = toRpcPayload(invoice, options)
  const { data, error } = await supabase.rpc("create_invoice_record", { p_invoice: payload })
  if (error) throw new Error(mapMutationError(error))

  const createdMeta = (data || {}) as Record<string, unknown>
  const createdInvoice = normalizeInvoiceRecord({
    ...invoice,
    id: String(createdMeta.id || invoice.id),
    invoiceNumber: String(createdMeta.invoiceNumber || invoice.invoiceNumber),
    createdAt: typeof createdMeta.createdAt === "string" ? createdMeta.createdAt : new Date().toISOString(),
    numberingModeAtCreation:
      createdMeta.numberingModeAtCreation === "financial-year-reset" ? "financial-year-reset" : "continuous",
    resetMonthDayAtCreation:
      typeof createdMeta.resetMonthDayAtCreation === "string" ? createdMeta.resetMonthDayAtCreation : null,
    sequenceWindowStart: typeof createdMeta.sequenceWindowStart === "string" ? createdMeta.sequenceWindowStart : null,
    sequenceWindowEnd: typeof createdMeta.sequenceWindowEnd === "string" ? createdMeta.sequenceWindowEnd : null,
    history: [
      createInvoiceHistoryEntry("created", "Invoice created"),
      ...(options?.duplicateSourceInvoiceNumber
        ? [createInvoiceHistoryEntry("duplicated", `Duplicated from ${options.duplicateSourceInvoiceNumber}`)]
        : []),
    ],
  })

  const invoices = readStoredInvoices()
  invoices.push(createdInvoice)
  writeStoredInvoices(invoices)
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("easybill:kv-write", { detail: { key: "invoices" } }))
  }
  return createdInvoice
}

export async function updateInvoiceViaSupabase(invoice: InvoiceRecord) {
  if (getAuthMode() !== "supabase") {
    const nextInvoices = replaceInvoiceById(readStoredInvoices(), invoice)
    if (!nextInvoices) throw new Error("Invoice not found.")
    writeStoredInvoices(nextInvoices)
    return invoice
  }

  const supabase = createSupabaseBrowserClient()
  const payload = toRpcPayload(invoice)
  const { error } = await supabase.rpc("update_invoice_record", { p_invoice: payload })
  if (error) throw new Error(mapMutationError(error))

  const nextInvoices = replaceInvoiceById(readStoredInvoices(), invoice)
  if (nextInvoices) {
    writeStoredInvoices(nextInvoices)
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("easybill:kv-write", { detail: { key: "invoices" } }))
    }
  }
  return invoice
}

export async function deleteInvoiceViaSupabase(invoiceId: string) {
  if (getAuthMode() !== "supabase") {
    const nextInvoices = readStoredInvoices().filter((invoice) => invoice.id !== invoiceId)
    writeStoredInvoices(nextInvoices)
    return true
  }

  const supabase = createSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("delete_invoice_record", { p_invoice_id: invoiceId })
  if (error) throw new Error(mapMutationError(error))
  const nextInvoices = readStoredInvoices().filter((invoice) => invoice.id !== invoiceId)
  writeStoredInvoices(nextInvoices)
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("easybill:kv-write", { detail: { key: "invoices" } }))
  }
  return Boolean(data)
}
