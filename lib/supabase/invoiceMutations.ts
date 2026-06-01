import type { InvoiceRecord } from "@/lib/invoice";
import { ensureInvoiceRecordForPdf, getWorkspaceDataAccess } from "@/lib/workspaceRuntime";

// Thin compatibility wrapper for existing invoice UI imports.

export async function syncInvoicesCacheFromSupabase() {
  return getWorkspaceDataAccess().fetchInvoices();
}

export async function createInvoiceViaSupabase(
  invoice: InvoiceRecord,
  options?: { duplicateSourceInvoiceNumber?: string }
) {
  return getWorkspaceDataAccess().createInvoice(invoice, options);
}

export async function updateInvoiceViaSupabase(invoice: InvoiceRecord) {
  return getWorkspaceDataAccess().updateInvoice(invoice);
}

export async function ensureInvoiceForPdfViaSupabase(invoice: InvoiceRecord) {
  return ensureInvoiceRecordForPdf(invoice);
}

export async function deleteInvoiceViaSupabase(invoiceId: string) {
  return getWorkspaceDataAccess().softDeleteInvoice(invoiceId);
}
