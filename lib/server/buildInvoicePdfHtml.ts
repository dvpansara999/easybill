import { formatCurrency } from "@/lib/formatCurrency"
import { formatDate } from "@/lib/dateFormat"
import {
  DEFAULT_INVOICE_VISIBILITY,
  type InvoiceVisibilitySettings,
} from "@/lib/invoiceVisibilityShared"
import { classicThemes } from "@/components/invoiceTemplates/Classic"
import { minimalThemes } from "@/components/invoiceTemplates/Minimal"
import { modernThemes } from "@/components/invoiceTemplates/Modern"
import type { TemplateTheme } from "@/components/invoiceTemplates/templateTypes"

type InvoiceItem = {
  product?: string
  hsn?: string
  qty?: number
  price?: number
  cgst?: number | string
  sgst?: number | string
  igst?: number | string
}

type InvoiceRecord = {
  invoiceNumber?: string
  clientName?: string
  clientPhone?: string
  clientEmail?: string
  clientGST?: string
  clientAddress?: string
  date?: string
  customDetails?: Array<{ label?: string; value?: string }>
  items?: InvoiceItem[]
  grandTotal?: number
}

type BusinessRecord = {
  businessName?: string
  address?: string
  gst?: string
  phone?: string
  email?: string
  bankName?: string
  accountNumber?: string
  ifsc?: string
  upi?: string
  terms?: string
  logo?: string
}

export type BuildInvoicePdfHtmlInput = {
  invoice: Record<string, unknown>
  business: Record<string, unknown> | null
  visibility: Partial<InvoiceVisibilitySettings> | null | undefined
  dateFormat: string
  amountFormat: string
  showDecimals: boolean
  currencySymbol: string
  currencyPosition: "before" | "after"
  templateId?: string
  fontFamily?: string
  fontSize?: number
}

const escapeHtml = (v: unknown) =>
  String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")

type PdfHeaderLayout =
  | "modern-banner"
  | "modern-stripe"
  | "modern-split"
  | "modern-gridHero"
  | "modern-folio"
  | "modern-frame"
  | "modern-glass"
  | "modern-side"
  | "minimal-plain"
  | "classic-card"
  | "default-clean"

type ResolvedPdfTheme = {
  accent: string
  soft: string
  tint: string
  line: string
  border: string
  headerLayout: PdfHeaderLayout
  tableZebra: boolean
  fontFamily: string
}

function resolvePdfTheme(templateId: string): ResolvedPdfTheme {
  const sans = "Inter, Segoe UI, Arial, sans-serif"
  const serif = "Georgia, Cambria, 'Times New Roman', serif"

  const defaultClean = (): ResolvedPdfTheme => ({
    accent: "#111827",
    soft: "#f3f4f6",
    tint: "#ffffff",
    line: "#e5e7eb",
    border: "#e5e7eb",
    headerLayout: "default-clean",
    tableZebra: false,
    fontFamily: sans,
  })

  if (templateId === "classic-default" || templateId === "default") {
    return defaultClean()
  }

  const modern = modernThemes[templateId] as TemplateTheme | undefined
  if (modern) {
    const mode = modern.mode || "banner"
    const modeToLayout: Record<string, PdfHeaderLayout> = {
      banner: "modern-banner",
      stripe: "modern-stripe",
      split: "modern-split",
      gridHero: "modern-gridHero",
      folio: "modern-folio",
      frame: "modern-frame",
      glass: "modern-glass",
      side: "modern-side",
    }
    return {
      accent: modern.accent,
      soft: modern.soft,
      tint: (modern as { tint?: string }).tint || modern.soft,
      line: modern.soft,
      border: "#e5e7eb",
      headerLayout: modeToLayout[mode] || "modern-banner",
      tableZebra: modern.table === "zebra",
      fontFamily: sans,
    }
  }

  const minimal = minimalThemes[templateId] as TemplateTheme | undefined
  if (minimal) {
    const line = (minimal as { line?: string }).line || "#e5e7eb"
    return {
      accent: minimal.accent,
      soft: minimal.soft,
      tint: minimal.soft,
      line,
      border: line,
      headerLayout: "minimal-plain",
      tableZebra: false,
      fontFamily: sans,
    }
  }

  const classic = classicThemes[templateId] as TemplateTheme | undefined
  if (classic) {
    const paper = (classic as { paper?: string }).paper || "#fffdf8"
    const border = (classic as { border?: string }).border || "#6b7280"
    return {
      accent: classic.accent,
      soft: border,
      tint: paper,
      line: border,
      border,
      headerLayout: "classic-card",
      tableZebra: classic.table === "ledger",
      fontFamily: classic.serif ? serif : sans,
    }
  }

  if (templateId.startsWith("modern-")) {
    const base = resolvePdfTheme("modern-default")
    const fallback = modernThemes["modern-default"]
    return {
      ...base,
      accent: fallback?.accent || base.accent,
      soft: fallback?.soft || base.soft,
      tint: (fallback as { tint?: string } | undefined)?.tint || fallback?.soft || base.tint,
    }
  }

  if (templateId.startsWith("minimal-")) {
    const base = resolvePdfTheme("minimal-light")
    const fallback = minimalThemes["minimal-light"]
    const line = (fallback as { line?: string } | undefined)?.line || base.line
    return {
      ...base,
      accent: fallback?.accent || base.accent,
      soft: fallback?.soft || base.soft,
      tint: fallback?.soft || base.tint,
      line,
      border: line,
    }
  }

  if (templateId.startsWith("classic-")) {
    const base = resolvePdfTheme("classic-ledger")
    const fallback = classicThemes["classic-ledger"]
    const paper = (fallback as { paper?: string } | undefined)?.paper || base.tint
    const border = (fallback as { border?: string } | undefined)?.border || base.border
    return {
      ...base,
      accent: fallback?.accent || base.accent,
      soft: border,
      tint: paper,
      line: border,
      border,
      fontFamily: fallback?.serif ? serif : sans,
    }
  }

  return defaultClean()
}

type HeaderCtx = {
  theme: ResolvedPdfTheme
  logoHtml: string
  businessTitle: string
  businessContactLight: string
  businessContactDark: string
  invoiceNumber: string
  dateLabel: string
  showBusinessName: boolean
}

function buildHeaderSectionHtml(layout: PdfHeaderLayout, ctx: HeaderCtx): string {
  const {
    theme,
    logoHtml,
    businessTitle,
    businessContactLight,
    businessContactDark,
    invoiceNumber,
    dateLabel,
    showBusinessName,
  } = ctx

  const h1 = showBusinessName ? businessTitle : "INVOICE"
  const invLine = `Invoice #${escapeHtml(invoiceNumber || "—")}`
  const dateStr = escapeHtml(dateLabel)

  const pillDate = `
    <div class="date-pill">
      <p class="k">Date</p>
      <p class="v">${dateStr}</p>
    </div>`

  const pillDateSoft = `
    <div class="date-pill-soft">
      <p class="k">Date</p>
      <p class="v">${dateStr}</p>
    </div>`

  const bannerDate = `
    <div class="banner-date">
      <p class="k">Issue Date</p>
      <p class="v">${dateStr}</p>
    </div>`

  switch (layout) {
    case "modern-banner":
      return `
      <section class="hero hero-banner">
        <div class="hero-banner-inner">
          <div class="hero-left">
            ${logoHtml}
            <div>
              <p class="hero-eyebrow">Invoice</p>
              <h1>${escapeHtml(h1)}</h1>
              <p class="inv-sub">${invLine}</p>
              <div class="contact-on-accent">${businessContactDark}</div>
            </div>
          </div>
          ${bannerDate}
        </div>
      </section>`

    case "modern-stripe":
      return `
      <section class="hdr-stripe-wrap">
        <div class="hdr-stripe-bar"></div>
        <div class="hdr-stripe-inner">
          <div class="hdr-stripe-left">
            ${logoHtml}
            <h1 class="title-dark">${escapeHtml(h1)}</h1>
            <p class="inv-sub-dark">${invLine}</p>
            <div class="contact-muted">${businessContactLight}</div>
          </div>
          ${pillDateSoft}
        </div>
      </section>`

    case "modern-split":
      return `
      <section class="hdr-split">
        <div class="hdr-split-left">
          ${logoHtml}
          <p class="accent-label">Invoice</p>
          <h1 class="title-dark">${escapeHtml(h1)}</h1>
          <p class="inv-sub-dark">${invLine}</p>
          <div class="contact-muted">${businessContactLight}</div>
        </div>
        <div class="hdr-split-right">
          <p class="k-inv">Date</p>
          <p class="v-inv">${dateStr}</p>
        </div>
      </section>`

    case "modern-gridHero":
      return `
      <section class="hdr-grid-hero">
        <div class="hdr-gh-left">
          ${logoHtml}
          <p class="hero-eyebrow">Invoice</p>
          <h1>${escapeHtml(h1)}</h1>
          <p class="inv-sub">${invLine}</p>
        </div>
        <div class="hdr-gh-right">
          <p class="k-muted">Issued On</p>
          <p class="v-big-dark">${dateStr}</p>
          <div class="contact-muted" style="margin-top:14px;">${businessContactLight}</div>
        </div>
      </section>`

    case "modern-folio":
      return `
      <section class="hdr-folio">
        <div class="hdr-folio-top">
          <div>
            ${logoHtml}
            <p class="accent-label">Business Invoice</p>
            <h1 class="title-dark">${escapeHtml(h1)}</h1>
          </div>
          <div class="hdr-folio-meta">
            <p class="k-muted">${invLine}</p>
            <p class="v-mid-dark">${dateStr}</p>
          </div>
        </div>
        <div class="contact-muted">${businessContactLight}</div>
      </section>`

    case "modern-frame":
      return `
      <section class="hdr-frame-outer">
        <div class="hdr-frame-inner">
          <div class="hdr-frame-row">
            <div>
              ${logoHtml}
              <h1 class="title-accent">${escapeHtml(h1)}</h1>
              <p class="inv-sub-dark">${invLine}</p>
              <div class="contact-muted">${businessContactLight}</div>
            </div>
            <div class="hdr-frame-date">
              <p class="k-muted">Date</p>
              <p class="v-mid-dark">${dateStr}</p>
            </div>
          </div>
        </div>
      </section>`

    case "modern-glass":
      return `
      <section class="hdr-glass">
        <div class="hdr-glass-row">
          <div>
            ${logoHtml}
            <h1 class="title-dark">${escapeHtml(h1)}</h1>
            <p class="inv-sub-dark">${invLine}</p>
            <div class="contact-muted">${businessContactLight}</div>
          </div>
          ${pillDateSoft}
        </div>
      </section>`

    case "modern-side":
      return `
      <section class="hdr-side">
        <div class="hdr-side-left">
          <p class="hero-eyebrow">Invoice</p>
          <p class="k-inv" style="margin-top:18px;">No.</p>
          <p class="v-side-num">${escapeHtml(invoiceNumber || "—")}</p>
          <p class="k-inv" style="margin-top:18px;">Date</p>
          <p class="v-side-date">${dateStr}</p>
        </div>
        <div class="hdr-side-right">
          ${logoHtml}
          <h1 class="title-dark">${escapeHtml(h1)}</h1>
          <div class="contact-muted" style="margin-top:14px;">${businessContactLight}</div>
        </div>
      </section>`

    case "minimal-plain":
      return `
      <section class="hdr-minimal">
        <div class="hdr-minimal-row">
          <div>
            ${logoHtml}
            <p class="accent-label">Invoice</p>
            <h1 class="title-dark">${escapeHtml(h1)}</h1>
            <p class="inv-sub-dark">${invLine}</p>
            <div class="contact-muted">${businessContactLight}</div>
          </div>
          <div class="hdr-minimal-date">
            <p class="k-muted">Date</p>
            <p class="v-mid-dark">${dateStr}</p>
          </div>
        </div>
      </section>`

    case "classic-card":
      return `
      <section class="hdr-classic">
        <div class="hdr-classic-inner">
          <div class="hdr-classic-row">
            <div>
              ${logoHtml}
              <h1 class="title-dark">${escapeHtml(h1)}</h1>
              <p class="inv-sub-dark">${invLine}</p>
              <div class="contact-muted">${businessContactLight}</div>
            </div>
            ${pillDate}
          </div>
        </div>
      </section>`

    case "default-clean":
    default:
      return `
      <section class="hdr-default">
        <div class="hdr-default-row">
          <div>
            ${logoHtml}
            <p class="k-muted">Invoice</p>
            <h1 class="title-dark">${escapeHtml(h1)}</h1>
            <div class="contact-muted">${businessContactLight}</div>
            <p class="inv-sub-dark" style="margin-top:8px;">${invLine}</p>
          </div>
          ${pillDate}
        </div>
      </section>`
  }
}

export function buildInvoicePdfHtml(input: BuildInvoicePdfHtmlInput): string {
  const inv = input.invoice as InvoiceRecord
  const biz = (input.business || {}) as BusinessRecord
  const vis = { ...DEFAULT_INVOICE_VISIBILITY, ...(input.visibility || {}) }
  const templateId = String(input.templateId || "classic-default")
  const theme = resolvePdfTheme(templateId)

  const items = Array.isArray(inv.items) ? inv.items : []
  let subtotal = 0
  let totalCGST = 0
  let totalSGST = 0
  let totalIGST = 0

  const rows = items
    .map((item) => {
      const qty = Number(item.qty) || 0
      const price = Number(item.price) || 0
      const base = qty * price
      const cgstAmount = item.cgst ? (base * Number(item.cgst)) / 100 : 0
      const sgstAmount = item.sgst ? (base * Number(item.sgst)) / 100 : 0
      const igstAmount = item.igst ? (base * Number(item.igst)) / 100 : 0
      const total = base + cgstAmount + sgstAmount + igstAmount
      subtotal += base
      totalCGST += cgstAmount
      totalSGST += sgstAmount
      totalIGST += igstAmount
      const money = (n: number) =>
        formatCurrency(
          n,
          input.currencySymbol,
          input.currencyPosition,
          input.showDecimals,
          input.amountFormat
        )
      const gst = (rate: string | number | null | undefined, amt: number) =>
        !rate || rate === "" || rate === "0" ? "-" : `${money(amt)} (${rate}%)`
      return `
        <tr>
          <td>${escapeHtml(item.product || "-")}</td>
          <td>${escapeHtml(item.hsn || "-")}</td>
          <td>${escapeHtml(String(qty))}</td>
          <td>${escapeHtml(money(price))}</td>
          <td>${escapeHtml(gst(item.cgst, cgstAmount))}</td>
          <td>${escapeHtml(gst(item.sgst, sgstAmount))}</td>
          <td>${escapeHtml(gst(item.igst, igstAmount))}</td>
          <td class="num">${escapeHtml(money(total))}</td>
        </tr>
      `
    })
    .join("")

  const totalValue =
    Number(inv.grandTotal) ||
    subtotal + totalCGST + totalSGST + totalIGST

  const details = Array.isArray(inv.customDetails) ? inv.customDetails : []
  const detailsHtml = details.length
    ? details
        .map((d) => `<p><b>${escapeHtml(d.label || "")}:</b> ${escapeHtml(d.value || "")}</p>`)
        .join("")
    : "<p class='muted'>No additional details</p>"

  const fmt = (n: number) =>
    formatCurrency(
      n,
      input.currencySymbol,
      input.currencyPosition,
      input.showDecimals,
      input.amountFormat
    )

  const billTo = `
    <div class="card">
      <h4>BILL TO</h4>
      <h3>${escapeHtml(vis.clientName ? inv.clientName || "-" : "-")}</h3>
      ${vis.clientPhone && inv.clientPhone ? `<p>${escapeHtml(inv.clientPhone)}</p>` : ""}
      ${inv.clientEmail ? `<p>${escapeHtml(inv.clientEmail)}</p>` : ""}
      ${vis.clientGstin && inv.clientGST ? `<p>GSTIN: ${escapeHtml(inv.clientGST)}</p>` : ""}
      ${vis.clientAddress && inv.clientAddress ? `<p>${escapeHtml(inv.clientAddress)}</p>` : ""}
    </div>
  `

  const businessContactLight = `
    ${vis.businessAddress && biz.address ? `<p>${escapeHtml(biz.address)}</p>` : ""}
    ${vis.businessPhone && biz.phone ? `<p>${escapeHtml(biz.phone)}</p>` : ""}
    ${biz.email ? `<p>${escapeHtml(biz.email)}</p>` : ""}
    ${vis.businessGstin && biz.gst ? `<p>GSTIN: ${escapeHtml(biz.gst)}</p>` : ""}
  `

  const businessContactDark = businessContactLight.replaceAll("<p>", '<p class="on-accent">')

  const logoHtml =
    vis.businessLogo && biz.logo
      ? `<img class="logo" src="${escapeHtml(biz.logo)}" alt="" />`
      : ""

  const dateStr = formatDate(inv.date || "", input.dateFormat)

  const headerHtml = buildHeaderSectionHtml(theme.headerLayout, {
    theme,
    logoHtml,
    businessTitle: biz.businessName || "INVOICE",
    businessContactLight,
    businessContactDark,
    invoiceNumber: inv.invoiceNumber || "",
    dateLabel: dateStr,
    showBusinessName: vis.businessName,
  })
  const normalizedFontSize = Number.isFinite(input.fontSize)
    ? Math.max(7, Math.min(17, Number(input.fontSize)))
    : 10
  const rootFontFamily = String(input.fontFamily || theme.fontFamily || "Inter, Segoe UI, Arial, sans-serif")
  /** PDF layout assumed ~10px body; `.page` sets real px — use `em` so template font size affects all text. */
  const e = (pxAtBase10: number) => `${pxAtBase10 / 10}em`

  const zebraCss = theme.tableZebra
    ? `tbody tr:nth-child(even) { background: ${theme.soft}33; }`
    : ""

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      :root { color-scheme: only light; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: ${theme.tint};
        color: #111827;
      }
      .page {
        width: 794px;
        margin: 0 auto;
        padding: 20px 24px 26px;
        font-family: ${rootFontFamily};
        font-size: ${normalizedFontSize}px;
        line-height: 1.45;
      }
      .logo {
        width: 58px; height: 58px; object-fit: cover; border-radius: 12px;
        background: white; border: 1px solid rgba(0,0,0,0.08); padding: 2px;
      }
      .hero-banner {
        background: ${theme.accent};
        color: white;
        border-radius: 16px;
        padding: 18px;
      }
      .hero-banner-inner {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 14px;
        align-items: start;
      }
      .hero-left { display: flex; gap: 12px; }
      .hero-eyebrow { margin: 0; font-size: ${e(11)}; letter-spacing: 0.25em; text-transform: uppercase; opacity: 0.75; }
      .hero-banner h1 { margin: 8px 0 4px; font-size: ${e(36)}; line-height: 1; letter-spacing: -0.02em; }
      .inv-sub { margin: 4px 0 0; font-size: ${e(15)}; opacity: 0.88; }
      .contact-on-accent p, .contact-on-accent .on-accent { margin: 2px 0; font-size: ${e(13)}; color: rgba(255,255,255,0.9); }
      .banner-date {
        background: rgba(255,255,255,0.12);
        border-radius: 14px;
        padding: 10px 14px;
        text-align: right;
        min-width: 130px;
      }
      .banner-date .k { margin: 0; font-size: ${e(12)}; color: rgba(255,255,255,0.75); }
      .banner-date .v { margin: 4px 0 0; font-size: ${e(22)}; font-weight: 700; }

      .hdr-stripe-wrap {
        border-radius: 16px;
        border: 1px solid ${theme.border};
        background: white;
        overflow: hidden;
      }
      .hdr-stripe-bar { height: 12px; background: ${theme.accent}; }
      .hdr-stripe-inner { display: flex; justify-content: space-between; gap: 20px; padding: 18px; align-items: flex-start; }
      .title-dark { margin: 0 0 4px; font-size: ${e(34)}; line-height: 1; letter-spacing: -0.02em; }
      .inv-sub-dark { margin: 4px 0 0; font-size: ${e(15)}; color: #6b7280; }
      .contact-muted p { margin: 2px 0; font-size: ${e(13)}; color: #4b5563; }
      .accent-label { margin: 0 0 6px; font-size: ${e(11)}; letter-spacing: 0.2em; text-transform: uppercase; color: ${theme.accent}; font-weight: 600; }
      .date-pill-soft {
        background: ${theme.soft};
        border-radius: 14px;
        min-width: 120px;
        padding: 10px 14px;
        text-align: right;
      }
      .date-pill-soft .k { margin: 0; font-size: ${e(12)}; color: #6b7280; }
      .date-pill-soft .v { margin: 4px 0 0; font-weight: 700; font-size: ${e(22)}; }

      .hdr-split {
        display: grid;
        grid-template-columns: 1.35fr 0.9fr;
        border-radius: 16px;
        border: 1px solid ${theme.border};
        background: white;
        overflow: hidden;
      }
      .hdr-split-left { padding: 18px; }
      .hdr-split-right {
        padding: 18px;
        background: ${theme.accent};
        color: white;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .hdr-split-right .k-inv { margin: 0; font-size: ${e(13)}; opacity: 0.8; }
      .hdr-split-right .v-inv { margin: 6px 0 0; font-size: ${e(28)}; font-weight: 700; }

      .hdr-grid-hero {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .hdr-gh-left {
        border-radius: 16px;
        padding: 18px;
        background: ${theme.accent};
        color: white;
      }
      .hdr-gh-left h1 { margin: 8px 0 4px; font-size: ${e(32)}; }
      .hdr-gh-left .inv-sub { opacity: 0.88; }
      .hdr-gh-right {
        border-radius: 16px;
        padding: 18px;
        background: ${theme.soft};
      }
      .k-muted { margin: 0; font-size: ${e(13)}; color: #6b7280; }
      .v-big-dark { margin: 6px 0 0; font-size: ${e(28)}; font-weight: 700; color: #111827; }
      .v-mid-dark { margin: 6px 0 0; font-size: ${e(22)}; font-weight: 700; color: #111827; }

      .hdr-folio {
        border-radius: 16px;
        border: 1px solid ${theme.border};
        background: white;
        padding: 18px;
      }
      .hdr-folio-top { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; }
      .hdr-folio-meta { text-align: right; }

      .hdr-frame-outer {
        border-radius: 16px;
        border: 2px solid ${theme.accent};
        padding: 8px;
        background: white;
      }
      .hdr-frame-inner {
        border-radius: 12px;
        border: 1px solid ${theme.soft};
        padding: 16px;
      }
      .hdr-frame-row { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
      .title-accent { margin: 0 0 4px; font-size: ${e(34)}; color: ${theme.accent}; font-weight: 700; }
      .hdr-frame-date { text-align: right; }

      .hdr-glass {
        border-radius: 16px;
        border: 1px solid #e5e7eb;
        background: #fafafa;
        padding: 18px;
      }
      .hdr-glass-row { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }

      .hdr-side {
        display: grid;
        grid-template-columns: 220px 1fr;
        border-radius: 16px;
        border: 1px solid ${theme.border};
        background: white;
        overflow: hidden;
      }
      .hdr-side-left {
        padding: 18px;
        background: ${theme.accent};
        color: white;
      }
      .v-side-num { margin: 4px 0 0; font-size: ${e(22)}; font-weight: 700; }
      .v-side-date { margin: 4px 0 0; font-size: ${e(18)}; font-weight: 600; }
      .hdr-side-right { padding: 18px; }

      .hdr-minimal {
        border-bottom: 1px solid ${theme.line};
        padding-bottom: 16px;
        margin-bottom: 4px;
      }
      .hdr-minimal-row { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
      .hdr-minimal-date { text-align: right; }

      .hdr-classic {
        border-radius: 14px;
        border: 2px solid ${theme.border};
        background: #fff;
        padding: 4px;
        margin-bottom: 2px;
      }
      .hdr-classic-inner {
        border-radius: 10px;
        border: 1px solid ${theme.line};
        padding: 14px;
      }
      .hdr-classic-row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 12px;
        align-items: start;
      }

      .hdr-default {
        border-bottom: 1px solid ${theme.line};
        padding-bottom: 16px;
        margin-bottom: 4px;
      }
      .hdr-default-row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 12px;
        align-items: start;
      }

      .date-pill {
        background: ${theme.soft};
        color: #111827;
        border-radius: 14px;
        min-width: 120px;
        height: auto;
        padding: 10px 12px;
        text-align: right;
        align-self: start;
      }
      .date-pill .k { margin: 0; font-size: ${e(12)}; color: #6b7280; }
      .date-pill .v { margin: 4px 0 0; font-weight: 700; font-size: ${e(22)}; }

      .grid2 {
        margin-top: 14px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .card {
        background: white;
        border-radius: 14px;
        border: 1px solid ${theme.soft};
        padding: 12px;
      }
      .card h4 { margin: 0 0 8px; font-size: ${e(11)}; color: #6b7280; letter-spacing: .15em; }
      .card h3 { margin: 0 0 6px; font-size: ${e(24)}; line-height: 1; }
      .card p { margin: 2px 0; font-size: ${e(13)}; color: #374151; }
      .muted { color: #9ca3af !important; }
      .tbl-wrap {
        margin-top: 12px;
        border: 1px solid ${theme.soft};
        border-radius: 14px;
        background: white;
        overflow: hidden;
      }
      table { width: 100%; border-collapse: collapse; font-size: ${e(12)}; }
      th, td { padding: 8px 8px; border-bottom: 1px solid #f0f2f5; text-align: left; vertical-align: top; }
      th { background: ${theme.soft}; color: #374151; font-size: ${e(11)}; letter-spacing: .06em; text-transform: uppercase; }
      td.num, th.num { text-align: right; }
      ${zebraCss}
      .summary {
        margin-top: 12px;
        margin-left: auto;
        width: 280px;
        border: 1px solid ${theme.soft};
        border-radius: 12px;
        background: white;
        overflow: hidden;
      }
      .summary-h {
        background: ${theme.accent};
        color: white;
        padding: 10px 12px;
        font-size: ${e(11)};
        letter-spacing: .12em;
        text-transform: uppercase;
      }
      .summary-b { padding: 10px 12px; }
      .r { display: flex; justify-content: space-between; margin: 4px 0; font-size: ${e(13)}; }
      .total {
        margin-top: 8px; padding-top: 8px; border-top: 1px solid ${theme.soft};
        font-size: ${e(16)}; font-weight: 700;
      }
      .foot {
        margin-top: 14px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .foot h4 { margin: 0 0 8px; color: #6b7280; letter-spacing: .12em; font-size: ${e(11)}; }
    </style>
  </head>
  <body>
    <div class="page">
      ${headerHtml}

      <div class="grid2">
        ${billTo}
        <div class="card">
          <h4>ADDITIONAL DETAILS</h4>
          ${detailsHtml}
        </div>
      </div>

      <section class="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Item</th><th>HSN</th><th>Qty</th><th>Price</th>
              <th>CGST</th><th>SGST</th><th>IGST</th><th class="num">Amount</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </section>

      <section class="summary">
        <div class="summary-h">Invoice Summary</div>
        <div class="summary-b">
          <div class="r"><span>Subtotal</span><span>${escapeHtml(fmt(subtotal))}</span></div>
          <div class="r"><span>CGST</span><span>${escapeHtml(totalCGST ? fmt(totalCGST) : "-")}</span></div>
          <div class="r"><span>SGST</span><span>${escapeHtml(totalSGST ? fmt(totalSGST) : "-")}</span></div>
          <div class="r"><span>IGST</span><span>${escapeHtml(totalIGST ? fmt(totalIGST) : "-")}</span></div>
          <div class="r total"><span>Total</span><span>${escapeHtml(fmt(totalValue))}</span></div>
        </div>
      </section>

      <section class="foot">
        <div class="card">
          <h4>BANK DETAILS</h4>
          ${
            vis.businessBankDetails && (biz.bankName || biz.accountNumber || biz.ifsc || biz.upi)
              ? `
                ${biz.bankName ? `<p>Bank: ${escapeHtml(biz.bankName)}</p>` : ""}
                ${biz.accountNumber ? `<p>Account: ${escapeHtml(biz.accountNumber)}</p>` : ""}
                ${biz.ifsc ? `<p>IFSC: ${escapeHtml(biz.ifsc)}</p>` : ""}
                ${biz.upi ? `<p>UPI: ${escapeHtml(biz.upi)}</p>` : ""}
              `
              : `<p class="muted">No bank details</p>`
          }
        </div>
        <div class="card">
          <h4>TERMS</h4>
          ${
            vis.businessTerms && biz.terms
              ? `<p>${escapeHtml(biz.terms).replaceAll("\n", "<br />")}</p>`
              : `<p class="muted">No terms provided</p>`
          }
        </div>
      </section>

    </div>
  </body>
</html>`
}
