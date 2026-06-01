import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
  deleteWorkspaceKey,
  softDeleteInvoiceRecord,
} from "@/lib/supabase/workspaceRepository"
import {
  createSealedInvoiceRecord,
  ensureSealedWorkspaceSeed,
  fetchOpenedWorkspaceChanges,
  fetchOpenedWorkspaceSnapshotEntries,
  listOpenedInvoiceRecords,
  pushSealedWorkspaceKey,
  upsertSealedInvoiceRecord,
  updateSealedInvoiceRecord,
} from "@/lib/server/workspaceSealing"
import { assertAccountLifecycleUnlocked } from "@/lib/server/accountLifecycle"
import {
  mergeCustomersCache,
  mergeInvoicesCache,
  mergeProductsCache,
} from "@/lib/workspaceCacheMerge"
import type { InvoiceRecord } from "@/lib/invoice"
import type { RelationalCacheKey } from "@/lib/supabase/relationalSync"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type WorkspaceRequest =
  | { op: "ensureSeed"; userId?: string }
  | { op: "fetchSnapshot"; userId?: string }
  | {
      op: "fetchChanges"
      userId?: string
      changedSince?: string | null
      currentValues?: Partial<Record<"products" | "customers" | "invoices", string | null>>
    }
  | { op: "pushKey"; userId?: string; key?: RelationalCacheKey; rawValue?: string }
  | { op: "deleteKey"; userId?: string; key?: RelationalCacheKey }
  | { op: "listInvoices"; userId?: string }
  | { op: "createInvoice"; userId?: string; invoice?: InvoiceRecord; options?: { duplicateSourceInvoiceNumber?: string } }
  | { op: "upsertInvoice"; userId?: string; invoice?: InvoiceRecord }
  | { op: "updateInvoice"; userId?: string; invoice?: InvoiceRecord }
  | { op: "softDeleteInvoice"; userId?: string; invoiceId?: string }

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (error && typeof error === "object") {
    const details = error as {
      message?: unknown
      error?: unknown
      details?: unknown
      hint?: unknown
      code?: unknown
    }
    const parts = [details.message, details.error, details.details, details.hint, details.code]
      .filter((part): part is string | number => typeof part === "string" || typeof part === "number")
      .map(String)
      .filter(Boolean)
    if (parts.length) return parts.join(" ")
  }
  return "Workspace operation failed."
}

function isMutatingOperation(op: WorkspaceRequest["op"]) {
  return [
    "ensureSeed",
    "pushKey",
    "deleteKey",
    "createInvoice",
    "upsertInvoice",
    "updateInvoice",
    "softDeleteInvoice",
  ].includes(op)
}

async function requireUser(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, requestedUserId?: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("UNAUTHORIZED")
  if (requestedUserId && requestedUserId !== user.id) throw new Error("FORBIDDEN")
  return user.id
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as WorkspaceRequest
  const supabase = await createSupabaseServerClient()

  try {
    const userId = await requireUser(supabase, body.userId)
    if (isMutatingOperation(body.op)) {
      await assertAccountLifecycleUnlocked(supabase, userId)
    }

    switch (body.op) {
      case "ensureSeed":
        await ensureSealedWorkspaceSeed(supabase, userId)
        return NextResponse.json({ ok: true })

      case "fetchSnapshot":
        return NextResponse.json({ entries: await fetchOpenedWorkspaceSnapshotEntries(supabase, userId) })

      case "fetchChanges": {
        const currentValues = body.currentValues || {}
        const changes = await fetchOpenedWorkspaceChanges(supabase, userId, body.changedSince || null)
        const entries: Array<{ key: RelationalCacheKey; value: string }> = []
        if (changes.products.length) entries.push({ key: "products", value: mergeProductsCache(currentValues.products || null, changes.products) })
        if (changes.customers.length) entries.push({ key: "customers", value: mergeCustomersCache(currentValues.customers || null, changes.customers) })
        if (changes.invoices.length) entries.push({ key: "invoices", value: mergeInvoicesCache(currentValues.invoices || null, changes.invoices) })
        return NextResponse.json({ entries })
      }

      case "pushKey":
        if (!body.key) return errorResponse("Workspace key is required.")
        await pushSealedWorkspaceKey(supabase, userId, body.key, String(body.rawValue || ""))
        return NextResponse.json({ ok: true })

      case "deleteKey":
        if (!body.key) return errorResponse("Workspace key is required.")
        await deleteWorkspaceKey(supabase, userId, body.key)
        return NextResponse.json({ ok: true })

      case "listInvoices":
        return NextResponse.json({ invoices: await listOpenedInvoiceRecords(supabase, userId) })

      case "createInvoice":
        if (!body.invoice) return errorResponse("Invoice is required.")
        return NextResponse.json({ meta: await createSealedInvoiceRecord(supabase, body.invoice, body.options) })

      case "upsertInvoice":
        if (!body.invoice) return errorResponse("Invoice is required.")
        await upsertSealedInvoiceRecord(supabase, userId, body.invoice)
        return NextResponse.json({ ok: true })

      case "updateInvoice":
        if (!body.invoice) return errorResponse("Invoice is required.")
        await updateSealedInvoiceRecord(supabase, body.invoice)
        return NextResponse.json({ ok: true })

      case "softDeleteInvoice":
        if (!body.invoiceId) return errorResponse("Invoice id is required.")
        return NextResponse.json({ deleted: await softDeleteInvoiceRecord(supabase, userId, body.invoiceId) })

      default:
        return errorResponse("Unsupported workspace operation.")
    }
  } catch (error) {
    const message = getErrorMessage(error)
    if (message === "UNAUTHORIZED") return errorResponse("Sign in to sync this workspace.", 401)
    if (message === "FORBIDDEN") return errorResponse("Workspace user mismatch.", 403)
    return errorResponse(message, 500)
  }
}
