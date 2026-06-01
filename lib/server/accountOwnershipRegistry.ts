import type { RelationalCacheKey as KvKey } from "@/lib/supabase/relationalSync"
import { INVOICE_PDF_BUCKET } from "@/lib/server/invoicePdfExportConfig"
import { LOGO_BUCKET } from "@/lib/logoStorage"

export type OwnedTable =
  | { table: string; ownership: "user_id"; reset: "delete" }
  | { table: string; ownership: "invoice_id"; reset: "delete"; parentTable: "invoices" }
  | { table: string; ownership: "user_id"; reset: "recreate-defaults" }

export const ACCOUNT_OWNED_TABLES: OwnedTable[] = [
  { table: "invoice_pdf_exports", ownership: "user_id", reset: "delete" },
  { table: "invoice_history", ownership: "invoice_id", parentTable: "invoices", reset: "delete" },
  { table: "invoice_items", ownership: "invoice_id", parentTable: "invoices", reset: "delete" },
  { table: "invoices", ownership: "user_id", reset: "delete" },
  { table: "invoice_sequences", ownership: "user_id", reset: "delete" },
  { table: "products", ownership: "user_id", reset: "delete" },
  { table: "customers", ownership: "user_id", reset: "delete" },
  { table: "profiles", ownership: "user_id", reset: "recreate-defaults" },
  { table: "user_settings", ownership: "user_id", reset: "recreate-defaults" },
]

export const ACCOUNT_OWNED_STORAGE_BUCKETS = [
  { bucket: LOGO_BUCKET, pathPrefix: "{userId}/" },
  { bucket: INVOICE_PDF_BUCKET, pathPrefix: "{userId}/" },
] as const

export const ACCOUNT_OWNED_CACHE_KEYS: KvKey[] = [
  "accountSetupBundle",
  "businessProfile",
  "dateFormat",
  "amountFormat",
  "showDecimals",
  "invoicePrefix",
  "invoicePadding",
  "invoiceStartNumber",
  "resetYearly",
  "invoiceResetMonthDay",
  "currencySymbol",
  "currencyPosition",
  "invoiceVisibility",
  "invoiceTemplate",
  "templateTypography",
  "invoiceTemplateFontId",
  "invoiceTemplateFontSize",
  "subscriptionPlanId",
  "invoiceUsageCount",
  "invoiceUsageInitialized:v1",
  "emailChangeAudit",
  "products",
  "customers",
  "invoices",
]

export const ACCOUNT_LOCAL_ONLY_CACHE_KEYS = ["setupProfileDraft", "setupResumePath"] as const
export const ACCOUNT_SYNC_RETRY_QUEUE_KEY = "easybill:sync-retry-queue:v1"

export const PRESERVED_RESET_SETTINGS_FIELDS = [
  "subscription_plan_id",
  "invoice_usage_count",
  "invoice_usage_initialized",
] as const
