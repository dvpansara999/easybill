import { formatCurrency } from "@/lib/formatCurrency"
import { formatDate } from "@/lib/dateFormat"
import {
  DEFAULT_INVOICE_VISIBILITY,
  type InvoiceVisibilitySettings,
} from "@/lib/invoiceVisibilityShared"

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
}

const escapeHtml = (v: unknown) =>
  String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")

function pickTheme(templateId: string) {
  if (templateId.startsWith("modern-")) {
    return {
      accent: "#ea580c",
      soft: "#ffedd5",
      tint: "#fff7ed",
    }
  }
  if (templateId.startsWith("minimal-")) {
    return {
      accent: "#18181b",
      soft: "#e4e4e7",
      tint: "#fafafa",
    }
  }
  return {
    accent: "#1f2937",
    soft: "#e5e7eb",
    tint: "#f8fafc",
  }
}

export function buildInvoicePdfHtml(input: BuildInvoicePdfHtmlInput): string {
  const inv = input.invoice as InvoiceRecord
  const biz = (input.business || {}) as BusinessRecord
  const vis = { ...DEFAULT_INVOICE_VISIBILITY, ...(input.visibility || {}) }
  const templateId = String(input.templateId || "classic-default")
  const theme = pickTheme(templateId)

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

  const businessContact = `
    ${vis.businessAddress && biz.address ? `<p>${escapeHtml(biz.address)}</p>` : ""}
    ${vis.businessPhone && biz.phone ? `<p>${escapeHtml(biz.phone)}</p>` : ""}
    ${biz.email ? `<p>${escapeHtml(biz.email)}</p>` : ""}
    ${vis.businessGstin && biz.gst ? `<p>GSTIN: ${escapeHtml(biz.gst)}</p>` : ""}
  `

  const logoHtml =
    vis.businessLogo && biz.logo
      ? `<img class="logo" src="${escapeHtml(biz.logo)}" alt="" />`
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
        font-family: Inter, Segoe UI, Arial, sans-serif;
        background: ${theme.tint};
        color: #111827;
      }
      .page {
        width: 794px;
        margin: 0 auto;
        padding: 20px 24px 26px;
      }
      .hero {
        background: ${theme.accent};
        color: white;
        border-radius: 16px;
        padding: 18px;
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 14px;
      }
      .hero-left { display: flex; gap: 12px; }
      .logo {
        width: 58px; height: 58px; object-fit: cover; border-radius: 12px;
        background: white; border: 1px solid rgba(255,255,255,0.7); padding: 2px;
      }
      .hero h1 { margin: 0 0 4px; font-size: 40px; line-height: 1; letter-spacing: -0.02em; }
      .hero p { margin: 2px 0; font-size: 13px; opacity: 0.95; }
      .date-pill {
        background: ${theme.soft};
        color: #111827;
        border-radius: 14px;
        min-width: 120px;
        height: 58px;
        padding: 10px 12px;
        text-align: right;
      }
      .date-pill .k { margin: 0; font-size: 12px; color: #6b7280; }
      .date-pill .v { margin: 2px 0 0; font-weight: 700; font-size: 24px; }
      .meta { margin-top: 6px; color: rgba(255,255,255,0.92); font-size: 13px; }
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
      .card h4 { margin: 0 0 8px; font-size: 11px; color: #6b7280; letter-spacing: .15em; }
      .card h3 { margin: 0 0 6px; font-size: 24px; line-height: 1; }
      .card p { margin: 2px 0; font-size: 13px; color: #374151; }
      .muted { color: #9ca3af !important; }
      .tbl-wrap {
        margin-top: 12px;
        border: 1px solid ${theme.soft};
        border-radius: 14px;
        background: white;
        overflow: hidden;
      }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { padding: 8px 8px; border-bottom: 1px solid #f0f2f5; text-align: left; vertical-align: top; }
      th { background: ${theme.soft}; color: #374151; font-size: 11px; letter-spacing: .06em; text-transform: uppercase; }
      td.num, th.num { text-align: right; }
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
        font-size: 11px;
        letter-spacing: .12em;
        text-transform: uppercase;
      }
      .summary-b { padding: 10px 12px; }
      .r { display: flex; justify-content: space-between; margin: 4px 0; font-size: 13px; }
      .total {
        margin-top: 8px; padding-top: 8px; border-top: 1px solid ${theme.soft};
        font-size: 16px; font-weight: 700;
      }
      .foot {
        margin-top: 14px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .foot h4 { margin: 0 0 8px; color: #6b7280; letter-spacing: .12em; font-size: 11px; }
      .ready { display: none; }
    </style>
  </head>
  <body>
    <div class="page">
      <section class="hero">
        <div>
          <div class="hero-left">
            ${logoHtml}
            <div>
              <h1>${escapeHtml(vis.businessName ? biz.businessName || "INVOICE" : "INVOICE")}</h1>
              ${businessContact}
              <p class="meta">Invoice #${escapeHtml(inv.invoiceNumber || "—")}</p>
            </div>
          </div>
        </div>
        <div class="date-pill">
          <p class="k">Date</p>
          <p class="v">${escapeHtml(formatDate(inv.date || "", input.dateFormat))}</p>
        </div>
      </section>

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

      <div id="pdf-ready" class="ready">ready</div>
    </div>

    <script>
      (async function () {
        const root = document.querySelector(".page");
        const imgs = Array.from(document.querySelectorAll("img"));
        await Promise.race([
          Promise.all(imgs.map((img) => img.complete ? Promise.resolve() : new Promise((r) => {
            const done = () => r();
            img.addEventListener("load", done, { once: true });
            img.addEventListener("error", done, { once: true });
            setTimeout(done, 3000);
          }))),
          new Promise((r) => setTimeout(r, 3000)),
        ]);
        try { if (document.fonts?.ready) await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2000))]); } catch {}
        if (root && (root.textContent || "").trim().length > 20) {
          document.getElementById("pdf-ready")?.setAttribute("data-ready", "1");
        }
      })();
    </script>
  </body>
</html>`
}
