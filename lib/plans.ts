import { DEFAULT_TEMPLATE_ID, resolveTemplateId } from "@/lib/templateIds"

export type PlanId = "free" | "plus"

export type Plan = {
  id: PlanId
  name: string
  priceInr: number
  features: string[]
  limits: {
    maxInvoicesLifetime: number | null
    canEditInvoices: boolean
    maxProducts: number | null
    allowedTemplateIds: string[] | null
  }
}

// Central place to edit plans or add more later.
export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    priceInr: 0,
    features: [
      "Create up to 10 invoices (lifetime)",
      "Save up to 3 products",
      "Use 6 templates",
    ],
    limits: {
      maxInvoicesLifetime: 10,
      canEditInvoices: false,
      maxProducts: 3,
      allowedTemplateIds: [
        "modern-v01",
        "modern-v02",
        "minimal-v01",
        "minimal-v02",
        "classic-v01",
        "classic-v02",
      ],
    },
  },
  {
    id: "plus",
    name: "Plus",
    priceInr: 199,
    features: [
      "Unlimited invoices",
      "Invoice editing enabled",
      "All templates unlocked",
      "Unlimited products",
    ],
    limits: {
      maxInvoicesLifetime: null,
      canEditInvoices: true,
      maxProducts: null,
      allowedTemplateIds: null,
    },
  },
]

const STORAGE_PLAN_KEY = "subscriptionPlanId"
const STORAGE_INVOICE_USAGE_KEY = "invoiceUsageCount"
const STORAGE_USAGE_INIT_KEY = "invoiceUsageInitialized:v1"
 
// Avoid writing defaults before Supabase KV cache is hydrated.
function cloudHydrated() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getAuthMode } = require("@/lib/runtimeMode") as typeof import("@/lib/runtimeMode")
  if (getAuthMode() !== "supabase") return true
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { isActiveUserKvHydrated } = require("@/lib/userStore") as typeof import("@/lib/userStore")
  return isActiveUserKvHydrated()
}

function readScoped(key: string) {
  if (typeof window === "undefined") return null
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getActiveOrGlobalItem } = require("@/lib/userStore") as typeof import("@/lib/userStore")
  return getActiveOrGlobalItem(key)
}

function writeScoped(key: string, value: string) {
  if (typeof window === "undefined") return
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { setActiveOrGlobalItem } = require("@/lib/userStore") as typeof import("@/lib/userStore")
  setActiveOrGlobalItem(key, value)
}

export function getActivePlanId(): PlanId {
  const raw = readScoped(STORAGE_PLAN_KEY)
  if (raw === "plus") return "plus"
  return "free"
}

export function setActivePlanId(planId: PlanId) {
  writeScoped(STORAGE_PLAN_KEY, planId)

  // If user downgrades back to Free, immediately enforce restrictions.
  if (planId === "free") {
    enforceFreeRestrictions()
  }
}

export function getActivePlan(): Plan {
  const id = getActivePlanId()
  return PLANS.find((p) => p.id === id) || PLANS[0]
}

function ensureInvoiceUsageInitialized(): number {
  if (!cloudHydrated()) {
    // Defer initialization until cloud KV is loaded, otherwise we'd overwrite remote values.
    return 0
  }
  const init = readScoped(STORAGE_USAGE_INIT_KEY)
  const raw = readScoped(STORAGE_INVOICE_USAGE_KEY)

  // Already initialized and has a value (or at least a stored key).
  if (init === "1" && raw !== null) {
    const n = Number(raw || 0)
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0
  }

  // First-time init: seed usage count from existing invoices length (scoped per user).
  let invoiceCount = 0
  try {
    const invoicesRaw = readScoped("invoices")
    if (invoicesRaw) {
      const parsed = JSON.parse(invoicesRaw) as unknown
      if (Array.isArray(parsed)) invoiceCount = parsed.length
    }
  } catch {
    invoiceCount = 0
  }

  const seeded = Math.max(0, Math.floor(invoiceCount))
  writeScoped(STORAGE_INVOICE_USAGE_KEY, String(seeded))
  writeScoped(STORAGE_USAGE_INIT_KEY, "1")
  return seeded
}

export function getInvoiceUsageCount(): number {
  return ensureInvoiceUsageInitialized()
}

export function bumpInvoiceUsageCount(by = 1) {
  const current = ensureInvoiceUsageInitialized()
  const next = current + by
  writeScoped(STORAGE_INVOICE_USAGE_KEY, String(next))
  return next
}

export function canCreateAnotherInvoice(): { ok: boolean; remaining: number | null } {
  if (!cloudHydrated()) return { ok: false, remaining: 0 }
  const plan = getActivePlan()
  if (plan.limits.maxInvoicesLifetime === null) return { ok: true, remaining: null }
  const used = getInvoiceUsageCount()
  const remaining = Math.max(0, plan.limits.maxInvoicesLifetime - used)
  return { ok: remaining > 0, remaining }
}

export function canEditInvoices(): boolean {
  return getActivePlan().limits.canEditInvoices
}

export function canUseTemplate(templateId: string): boolean {
  const allowed = getActivePlan().limits.allowedTemplateIds
  if (!allowed) return true
  return allowed.includes(resolveTemplateId(templateId))
}

export function getMaxProducts(): number | null {
  return getActivePlan().limits.maxProducts
}

export function enforceFreeRestrictions() {
  if (!cloudHydrated()) return
  // Only applicable for Free plan.
  if (getActivePlanId() !== "free") return

  // If user had a locked template active while on Plus, force them back to an allowed template.
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getActiveOrGlobalItem, setActiveOrGlobalItem } = require("@/lib/userStore") as typeof import("@/lib/userStore")
    const current = resolveTemplateId(getActiveOrGlobalItem("invoiceTemplate") || DEFAULT_TEMPLATE_ID)
    if (!canUseTemplate(current)) {
      setActiveOrGlobalItem("invoiceTemplate", DEFAULT_TEMPLATE_ID)
    }
  } catch {
    // ignore
  }

  // Ensure invoice usage is initialized so existing invoices count toward Free limits.
  ensureInvoiceUsageInitialized()
}

