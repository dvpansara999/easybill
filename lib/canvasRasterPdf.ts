import jsPDF from "jspdf"

export type RasterPdfImageFormat = "PNG" | "JPEG"

/**
 * Append canvas pixels to jsPDF as one image per A4 page (no duplicate full-image embeds).
 * PNG = lossless text/edges (larger files); JPEG = smaller, slight loss.
 */
export function appendCanvasToPdfPages(
  pdf: InstanceType<typeof jsPDF>,
  canvas: HTMLCanvasElement,
  opts?: { format?: RasterPdfImageFormat; jpegQuality?: number }
) {
  const format: RasterPdfImageFormat = opts?.format ?? "PNG"
  const jpegQuality = opts?.format === "JPEG" ? opts.jpegQuality ?? 0.95 : 0.95

  const pageWidthMm = pdf.internal.pageSize.getWidth()
  const pageHeightMm = pdf.internal.pageSize.getHeight()

  const sliceHeightPx = Math.max(1, Math.ceil((pageHeightMm * canvas.width) / pageWidthMm))

  let y = 0
  let pageIdx = 0

  while (y < canvas.height) {
    const h = Math.min(sliceHeightPx, canvas.height - y)
    const slice = document.createElement("canvas")
    slice.width = canvas.width
    slice.height = h
    const ctx = slice.getContext("2d")
    if (!ctx) break
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, slice.width, slice.height)
    ctx.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h)

    const sliceHeightMm = (h * pageWidthMm) / canvas.width
    const data =
      format === "PNG" ? slice.toDataURL("image/png") : slice.toDataURL("image/jpeg", jpegQuality)

    if (pageIdx > 0) pdf.addPage()
    pdf.addImage(data, format, 0, 0, pageWidthMm, sliceHeightMm)

    y += h
    pageIdx++
  }
}

/** @deprecated Prefer appendCanvasToPdfPages with explicit format */
export function appendCanvasToPdfAsJpegPages(
  pdf: InstanceType<typeof jsPDF>,
  canvas: HTMLCanvasElement,
  jpegQuality = 0.92
) {
  appendCanvasToPdfPages(pdf, canvas, { format: "JPEG", jpegQuality })
}

export function looksLikePdfBytes(buf: Uint8Array) {
  return buf.length >= 4 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46
}
