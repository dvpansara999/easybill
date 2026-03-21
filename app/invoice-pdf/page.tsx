"use client"

import { useLayoutEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import SharedInvoiceTemplate from "@/components/invoiceTemplates/SharedInvoiceTemplate"
import type { TemplateComponentProps } from "@/components/invoiceTemplates/templateTypes"
import { formatCurrency } from "@/lib/formatCurrency"
import { formatDate } from "@/lib/dateFormat"
import { DEFAULT_INVOICE_VISIBILITY, type InvoiceVisibilitySettings } from "@/lib/invoiceVisibilityShared"
import { normalizeTemplateTypography } from "@/lib/globalTemplateTypography"

const A4_WIDTH_PX = 794
const A4_HEIGHT_PX = 1123
const PAGE_PADDING_PX = 38
const OVERFLOW_EPSILON_PX = 12

function hasMeaningfulContent(node: HTMLElement) {
  const text = (node.textContent || "").replace(/\s+/g, " ").trim()
  if (text.length > 0) return true
  return Boolean(node.querySelector("img,svg,table"))
}

function measureMeaningfulHeight(container: HTMLElement) {
  const blocks = Array.from(container.querySelectorAll<HTMLElement>(".eb-content-block"))
  if (!blocks.length) return container.scrollHeight || container.offsetHeight || A4_HEIGHT_PX
  const rootRect = container.getBoundingClientRect()
  let maxBottom = 0
  for (const block of blocks) {
    if (!hasMeaningfulContent(block)) continue
    const rect = block.getBoundingClientRect()
    const bottom = rect.bottom - rootRect.top
    maxBottom = Math.max(maxBottom, bottom)
  }
  if (maxBottom <= 0) return container.scrollHeight || container.offsetHeight || A4_HEIGHT_PX
  return Math.ceil(maxBottom + 2)
}

type PdfRenderPayload = {
  invoice: TemplateComponentProps["invoice"]
  business: TemplateComponentProps["business"]
  visibility: Partial<InvoiceVisibilitySettings> | null
  templateId: string
  dateFormat: string
  amountFormat: string
  showDecimals: boolean
  currencySymbol: string
  currencyPosition: "before" | "after"
  fontFamily: string
  fontSize: number
  totals: {
    subtotal: number
    totalCGST: number
    totalSGST: number
    totalIGST: number
  }
}

function readPayload(searchParams: URLSearchParams): PdfRenderPayload | null {
  const raw = searchParams.get("payload")
  if (!raw) return null
  try {
    const normalized = raw.replace(/-/g, "+").replace(/_/g, "/")
    const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4)
    // Base64url carries UTF-8 JSON bytes; decode safely to preserve symbols like ₹.
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0))
    const json = new TextDecoder("utf-8").decode(bytes)
    return JSON.parse(json) as PdfRenderPayload
  } catch {
    return null
  }
}

export default function InvoicePdfRenderPage() {
  const searchParams = useSearchParams()
  const payload = useMemo(() => readPayload(searchParams), [searchParams])
  const measureRef = useRef<HTMLDivElement | null>(null)
  const [contentHeight, setContentHeight] = useState(A4_HEIGHT_PX)
  const [dedicatedTermsPage, setDedicatedTermsPage] = useState(false)

  const templateData = useMemo<TemplateComponentProps | null>(() => {
    if (!payload) return null
    const visibility = { ...DEFAULT_INVOICE_VISIBILITY, ...(payload.visibility || {}) }
    const typography = normalizeTemplateTypography({
      fontFamily: payload.fontFamily,
      fontSize: payload.fontSize,
    })
    const money = (value: number) =>
      formatCurrency(
        value,
        payload.currencySymbol,
        payload.currencyPosition,
        payload.showDecimals,
        payload.amountFormat
      )
    const gstDisplay = (rate: string | number | null | undefined, amount: number) =>
      !rate || rate === "" || rate === "0" ? "-" : `${money(amount)} (${rate}%)`

    return {
      invoice: payload.invoice,
      business: payload.business,
      templateId: payload.templateId,
      fontFamily: typography.fontFamily,
      fontSize: typography.fontSize,
      subtotal: payload.totals.subtotal,
      totalCGST: payload.totals.totalCGST,
      totalSGST: payload.totals.totalSGST,
      totalIGST: payload.totals.totalIGST,
      money,
      gstDisplay,
      formatDate,
      dateFormat: payload.dateFormat,
      invoiceVisibility: visibility,
      renderContext: "screen",
    }
  }, [payload])

  useLayoutEffect(() => {
    const el = measureRef.current
    if (!el || !templateData) return

    const updateHeight = () => {
      const next = Math.max(A4_HEIGHT_PX, measureMeaningfulHeight(el))
      setContentHeight(next)
      setDedicatedTermsPage(Boolean(el.querySelector(".eb-terms-fullpage")))
    }

    const ro = new ResizeObserver(() => {
      requestAnimationFrame(updateHeight)
    })
    ro.observe(el)
    requestAnimationFrame(updateHeight)

    return () => ro.disconnect()
  }, [templateData])

  const pageCount = useMemo(() => {
    if (dedicatedTermsPage) return 2
    const overflowPx = Math.max(0, contentHeight - A4_HEIGHT_PX)
    if (overflowPx <= OVERFLOW_EPSILON_PX) return 1
    return Math.max(1, Math.ceil(contentHeight / A4_HEIGHT_PX))
  }, [contentHeight, dedicatedTermsPage])

  return (
    <main style={{ margin: 0, padding: 0, background: "#fff" }}>
      {!templateData ? (
        <div style={{ padding: 24 }}>Unable to render invoice preview.</div>
      ) : (
        <>
          <div className="pointer-events-none absolute left-[-99999px] top-0 h-0 w-0 overflow-hidden">
            <div ref={measureRef} style={{ width: A4_WIDTH_PX, padding: PAGE_PADDING_PX, boxSizing: "border-box" }}>
              <SharedInvoiceTemplate {...templateData} />
            </div>
          </div>

          <div data-easybill-pdf-ready="true">
            {Array.from({ length: pageCount }, (_, pageIndex) => {
              const pageClass = dedicatedTermsPage ? (pageIndex === 0 ? "eb-page-main" : "eb-page-terms") : ""
              const sliceTop = pageIndex * A4_HEIGHT_PX
              return (
                <section className={`eb-pdf-page ${pageClass}`} key={pageIndex}>
                  <div className="eb-pdf-page-inner">
                    {dedicatedTermsPage ? (
                      <div style={{ width: A4_WIDTH_PX, padding: PAGE_PADDING_PX, boxSizing: "border-box" }}>
                        <SharedInvoiceTemplate {...templateData} />
                      </div>
                    ) : (
                      <div style={{ transform: `translateY(-${sliceTop}px)` }}>
                        <div style={{ width: A4_WIDTH_PX, padding: PAGE_PADDING_PX, boxSizing: "border-box" }}>
                          <SharedInvoiceTemplate {...templateData} />
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )
            })}
          </div>
        </>
      )}
      <style jsx global>{`
        html,
        body {
          margin: 0;
          padding: 0;
          background: #ffffff;
        }
        .eb-pdf-page {
          width: 210mm;
          height: 297mm;
          overflow: hidden;
          break-after: page;
          page-break-after: always;
        }
        .eb-pdf-page:last-child {
          break-after: auto;
          page-break-after: auto;
        }
        .eb-pdf-page-inner {
          width: ${A4_WIDTH_PX}px;
          height: ${A4_HEIGHT_PX}px;
          margin: 0 auto;
          overflow: hidden;
          background: #fff;
        }
        @page {
          size: A4;
          margin: 0;
        }
        @media print {
          html, body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .eb-section {
            break-inside: auto !important;
            page-break-inside: auto !important;
          }
          .eb-section-items,
          .eb-section-summary,
          .eb-section-footer {
            margin-top: 16px !important;
          }
          .eb-section-summary {
            display: block !important;
          }
          .eb-section-summary > * {
            margin-left: auto !important;
            margin-right: 0 !important;
          }
          .eb-section-footer {
            /* Flatten decorative container in print so footer can fragment naturally. */
            padding: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: transparent !important;
            border: 0 !important;
            break-before: auto !important;
            page-break-before: auto !important;
          }
          /* Keep footer layout consistent with preview/invoice view in PDF. */
          .eb-footer-grid {
            display: grid !important;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
            column-gap: 24px !important;
            row-gap: 0 !important;
          }
          .eb-footer-grid > * {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .eb-summary-box {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            position: relative !important;
            z-index: 1 !important;
          }
          .eb-terms-fullpage {
            min-height: 980px !important;
          }
          .eb-page-main .eb-terms-fullpage {
            display: none !important;
          }
          .eb-page-terms .eb-content-block:not(.eb-terms-fullpage) {
            display: none !important;
          }
          .eb-page-terms .eb-terms-fullpage {
            margin-top: 0 !important;
            break-before: auto !important;
            page-break-before: auto !important;
          }
        }
      `}</style>
    </main>
  )
}
