/**
 * Stable JSON shape for `/api/invoice-pdf` error responses (SaaS-style client handling).
 */
export type PdfApiErrorBody = {
  error: string
  code:
    | "UNAUTHORIZED"
    | "NOT_FOUND"
    | "INVOICE_ID_REQUIRED"
    | "MISSING_INVOICE"
    | "KV_ERROR"
    | "PDF_ENGINE"
    | "PDF_NAV_TIMEOUT"
    | "PDF_RENDER"
    | "PDF_BUILD"
    | "INTERNAL"
}

export async function parsePdfApiErrorMessage(response: Response): Promise<string> {
  try {
    const j = (await response.json()) as Partial<PdfApiErrorBody>
    if (typeof j.error === "string" && j.error.trim()) return j.error.trim()
  } catch {
    // ignore
  }
  return `Request failed (${response.status})`
}

function responseBodyLooksLikeHtml(buffer: ArrayBuffer, contentType: string): boolean {
  const ct = contentType.toLowerCase()
  if (ct.includes("text/html")) return true
  if (buffer.byteLength < 8) return false
  const dv = new DataView(buffer)
  let off = 0
  if (buffer.byteLength >= 3) {
    const a = dv.getUint8(0)
    const b = dv.getUint8(1)
    const c = dv.getUint8(2)
    if (a === 0xef && b === 0xbb && c === 0xbf) off = 3
  }
  const slice = new Uint8Array(buffer, off, Math.min(96, buffer.byteLength - off))
  const head = new TextDecoder("utf-8", { fatal: false }).decode(slice).trimStart().toLowerCase()
  return head.startsWith("<!doctype html") || head.startsWith("<html")
}

/**
 * Reads the response body once and validates PDF magic bytes (%PDF).
 * Use after `response.ok` for success paths.
 */
export async function extractPdfBufferFromResponse(
  response: Response
): Promise<
  | { ok: true; bytes: Uint8Array; contentType: string; byteLength: number }
  | { ok: false; reason: string; contentType: string; byteLength: number; sampleHex: string }
> {
  const contentType = response.headers.get("content-type") || ""
  const ab = await response.arrayBuffer()
  if (ab.byteLength < 8) {
    return { ok: false, reason: "empty_body", contentType, byteLength: ab.byteLength, sampleHex: "" }
  }
  const bytes = new Uint8Array(ab)
  const sample = Array.from(bytes.slice(0, 16))
    .map((n) => n.toString(16).padStart(2, "0"))
    .join(" ")
  if (responseBodyLooksLikeHtml(ab, contentType)) {
    return { ok: false, reason: "html_not_pdf", contentType, byteLength: ab.byteLength, sampleHex: sample }
  }
  const looksLikePdf = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46
  if (!looksLikePdf) {
    return { ok: false, reason: "not_pdf_magic", contentType, byteLength: ab.byteLength, sampleHex: sample }
  }
  return { ok: true, bytes, contentType, byteLength: ab.byteLength }
}
