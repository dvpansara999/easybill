import type { RefObject } from "react"
import { getActiveUserId } from "@/lib/auth"
import { getAuthMode } from "@/lib/runtimeMode"
import { findInvoiceById, readStoredInvoices } from "@/lib/invoice"
import { isUserWorkspaceReady, readUserSyncWatermark } from "@/lib/userStore"

export type PdfReadinessResult =
  | { ok: true }
  | { ok: false; message: string; reason: string }

type CaptureRef = RefObject<HTMLElement | null>

function fail(reason: string, message: string): PdfReadinessResult {
  return { ok: false, reason, message }
}

function isMeaningfulInvoiceDom(element: HTMLElement) {
  const text = (element.textContent || "").replace(/\s+/g, " ").trim()
  if (text.length >= 12) return true
  return Boolean(element.querySelector("img,svg,table"))
}

async function waitForFontsReady(): Promise<PdfReadinessResult> {
  if (typeof document === "undefined") return fail("document_missing", "Invoice preview is not available yet.")
  try {
    await document.fonts.ready
    return { ok: true }
  } catch {
    return fail("fonts_not_ready", "Invoice fonts are still loading. Please try again.")
  }
}

async function waitForImageReady(image: HTMLImageElement): Promise<PdfReadinessResult> {
  if (image.complete) {
    if (image.naturalWidth > 0 && image.naturalHeight > 0) return { ok: true }
    return fail("image_not_ready", "Invoice images are still loading. Please try again.")
  }

  const loaded = await new Promise<boolean>((resolve) => {
    const cleanup = () => {
      image.removeEventListener("load", onLoad)
      image.removeEventListener("error", onError)
    }
    const onLoad = () => {
      cleanup()
      resolve(image.naturalWidth > 0 && image.naturalHeight > 0)
    }
    const onError = () => {
      cleanup()
      resolve(false)
    }
    image.addEventListener("load", onLoad, { once: true })
    image.addEventListener("error", onError, { once: true })
  })

  if (!loaded) return fail("image_not_ready", "Invoice images are still loading. Please try again.")

  if (typeof image.decode === "function") {
    try {
      await image.decode()
    } catch {
      return fail("image_not_ready", "Invoice images are still loading. Please try again.")
    }
  }

  return { ok: true }
}

async function waitForCaptureImagesReady(element: HTMLElement): Promise<PdfReadinessResult> {
  const images = Array.from(element.querySelectorAll("img"))
  for (const image of images) {
    const result = await waitForImageReady(image)
    if (!result.ok) return result
  }
  return { ok: true }
}

function validateCaptureMeasurement(element: HTMLElement): PdfReadinessResult {
  const rect = element.getBoundingClientRect()
  const width = Math.max(rect.width, element.offsetWidth, element.scrollWidth)
  const height = Math.max(rect.height, element.offsetHeight, element.scrollHeight)
  if (width < 4 || height < 4) {
    return fail("preview_not_measured", "Invoice preview is not ready yet. Please try again.")
  }
  return { ok: true }
}

export async function waitForServerPdfReadiness({
  invoiceId,
}: {
  invoiceId: string
}): Promise<PdfReadinessResult> {
  if (!invoiceId || !String(invoiceId).trim()) {
    return fail("missing_invoice_id", "Invoice id is missing. Refresh the page and try again.")
  }

  if (typeof window === "undefined" || typeof fetch !== "function") {
    return fail("request_unavailable", "PDF download is not available in this browser.")
  }

  const userId = getActiveUserId()
  if (!userId) {
    return fail("missing_user", "Sign in again to download this invoice.")
  }

  if (getAuthMode() === "supabase") {
    if (!isUserWorkspaceReady(userId) || !readUserSyncWatermark(userId)) {
      return fail("workspace_not_ready", "Your workspace is still loading. Please try again in a moment.")
    }
  }

  return { ok: true }
}

export async function waitForFallbackCaptureReadiness({
  invoiceId,
  captureRef,
}: {
  invoiceId: string
  captureRef: CaptureRef
}): Promise<PdfReadinessResult> {
  if (!invoiceId || !String(invoiceId).trim()) {
    return fail("missing_invoice_id", "Invoice id is missing. Refresh the page and try again.")
  }

  const invoice = findInvoiceById(readStoredInvoices(), invoiceId)
  if (!invoice) {
    return fail("missing_invoice", "Invoice data is not ready yet. Please try again.")
  }

  const element = captureRef.current
  if (!element) {
    return fail("missing_capture_dom", "Invoice preview is not ready yet. Please try again.")
  }

  if (!isMeaningfulInvoiceDom(element)) {
    return fail("empty_capture_dom", "Invoice preview is still loading. Please try again.")
  }

  const fonts = await waitForFontsReady()
  if (!fonts.ok) return fonts

  const images = await waitForCaptureImagesReady(element)
  if (!images.ok) return images

  return validateCaptureMeasurement(element)
}

export function validatePdfCaptureCanvas(canvas: HTMLCanvasElement): PdfReadinessResult {
  if (!canvas || canvas.width < 4 || canvas.height < 4) {
    return fail("invalid_canvas", "Invoice capture was empty. Please try again.")
  }
  return { ok: true }
}
