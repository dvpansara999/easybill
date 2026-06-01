import crypto from "node:crypto"
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { createClient } from "@supabase/supabase-js"

export const CONFIRM_VALUE = "EASYBILL_DEV_WORKSPACE"
export const LOGO_BUCKET = "logos"
export const PDF_BUCKET = "invoice-pdfs"

const SEALED_PREFIX = "sealed:v1:"
const PDF_BYTES = Buffer.from(
  `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 240 160] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 54 >>
stream
BT /F1 12 Tf 40 90 Td (easyBILL dev workspace PDF) Tj ET
endstream
endobj
trailer
<< /Root 1 0 R >>
%%EOF`,
  "utf8"
)

const PROFILE_SENSITIVE_KEYS = ["business_name", "phone", "gst", "bank_name", "account_number", "ifsc", "upi"]
const CUSTOMER_SENSITIVE_KEYS = ["phone", "gst"]
const INVOICE_SENSITIVE_KEYS = ["client_phone", "client_gst"]

loadEnvFiles()

function loadEnvFiles() {
  for (const filename of [".env.local", "env.local", ".env"]) {
    const path = resolve(filename)
    if (!existsSync(path)) continue
    const contents = readFileSync(path, "utf8")
    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue
      const index = trimmed.indexOf("=")
      const key = trimmed.slice(0, index).trim()
      let value = trimmed.slice(index + 1).trim()
      if (!key || process.env[key] !== undefined) continue
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      process.env[key] = value
    }
  }
}

export function readEnv() {
  const env = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
    encryptionKey: process.env.SERVER_DATA_ENCRYPTION_KEY,
    hashKey: process.env.SERVER_DATA_HASH_KEY || process.env.SERVER_DATA_ENCRYPTION_KEY,
    confirm: process.env.DEV_WORKSPACE_CONFIRM,
    primary: {
      email: process.env.DEV_WORKSPACE_EMAIL?.trim(),
      password: process.env.DEV_WORKSPACE_PASSWORD,
      userId: process.env.DEV_WORKSPACE_USER_ID?.trim(),
    },
    secondary: {
      email: process.env.DEV_WORKSPACE_SECONDARY_EMAIL?.trim(),
      password: process.env.DEV_WORKSPACE_SECONDARY_PASSWORD,
      userId: process.env.DEV_WORKSPACE_SECONDARY_USER_ID?.trim(),
    },
  }

  const missing = []
  for (const [key, value] of [
    ["NEXT_PUBLIC_SUPABASE_URL", env.url],
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY", env.anonKey],
    ["SUPABASE_SERVICE_ROLE_KEY", env.serviceKey],
    ["SERVER_DATA_ENCRYPTION_KEY", env.encryptionKey],
    ["DEV_WORKSPACE_CONFIRM", env.confirm],
    ["DEV_WORKSPACE_EMAIL", env.primary.email],
    ["DEV_WORKSPACE_PASSWORD", env.primary.password],
    ["DEV_WORKSPACE_USER_ID", env.primary.userId],
    ["DEV_WORKSPACE_SECONDARY_EMAIL", env.secondary.email],
    ["DEV_WORKSPACE_SECONDARY_PASSWORD", env.secondary.password],
    ["DEV_WORKSPACE_SECONDARY_USER_ID", env.secondary.userId],
  ]) {
    if (!value) missing.push(key)
  }
  if (missing.length) throw new Error(`Missing required dev workspace env vars: ${missing.join(", ")}`)
  if (env.confirm !== CONFIRM_VALUE) {
    throw new Error(`DEV_WORKSPACE_CONFIRM must be exactly ${CONFIRM_VALUE}`)
  }
  if (env.primary.userId === env.secondary.userId || env.primary.email === env.secondary.email) {
    throw new Error("Primary and secondary dev workspace accounts must be distinct.")
  }
  return env
}

export function createAdmin(env) {
  return createClient(env.url, env.serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
}

export function createAnon(env) {
  return createClient(env.url, env.anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function findAuthUserById(admin, userId) {
  let page = 1
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    const found = data.users.find((user) => user.id === userId)
    if (found) return found
    if (data.users.length < 1000) return null
    page += 1
  }
}

export async function assertAccountMatches(admin, account, label) {
  const user = await findAuthUserById(admin, account.userId)
  if (!user) throw new Error(`${label} auth user ${account.userId} does not exist.`)
  if ((user.email || "").toLowerCase() !== account.email.toLowerCase()) {
    throw new Error(`${label} auth user email mismatch. Expected ${account.email}, got ${user.email || "(none)"}.`)
  }
  return user
}

export async function ensureAuthAccount(admin, account, label) {
  const existing = await findAuthUserById(admin, account.userId)
  if (existing) return assertAccountMatches(admin, account, label)
  const { data, error } = await admin.auth.admin.createUser({
    id: account.userId,
    email: account.email,
    password: account.password,
    email_confirm: true,
    user_metadata: { easybill_dev_workspace: label },
  })
  if (error) throw error
  return data.user
}

function keyBytes() {
  return crypto.createHash("sha256").update(process.env.SERVER_DATA_ENCRYPTION_KEY || "").digest()
}

function sealSensitiveString(value) {
  if (!value || String(value).startsWith(SEALED_PREFIX)) return value
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", keyBytes(), iv)
  const ciphertext = Buffer.concat([cipher.update(String(value), "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${SEALED_PREFIX}${Buffer.concat([iv, tag, ciphertext]).toString("base64url")}`
}

function sealSensitiveFields(row, keys) {
  const next = { ...row }
  for (const key of keys) {
    if (typeof next[key] === "string") next[key] = sealSensitiveString(next[key])
  }
  return next
}

function normalizeLookup(value, kind) {
  const raw = String(value || "").replace(/\s+/g, " ").trim()
  if (!raw) return ""
  if (kind === "phone") return raw.replace(/[^\d+]/g, "")
  if (kind === "gst") return raw.toUpperCase()
  return raw.toLowerCase()
}

function lookupHash(value, purpose) {
  const normalized = normalizeLookup(value, purpose)
  if (!normalized) return ""
  return crypto
    .createHmac("sha256", Buffer.from(process.env.SERVER_DATA_HASH_KEY || process.env.SERVER_DATA_ENCRYPTION_KEY || "", "utf8"))
    .update(`easybill:${purpose}:v1:${normalized}`)
    .digest("base64url")
}

function customerIdentity(input) {
  const phone = lookupHash(input.phone, "phone")
  if (phone) return `phone:${phone}`
  const gst = lookupHash(input.gst, "gst")
  if (gst) return `gst:${gst}`
  const legacy = lookupHash(JSON.stringify({
    name: normalizeLookup(input.name, "legacy"),
    email: normalizeLookup(input.email, "email"),
    address: normalizeLookup(input.address, "legacy"),
  }), "legacy")
  return legacy ? `legacy:${legacy}` : ""
}

export function buildProducts(userId, count) {
  const names = [
    "Cement PPC", "TMT Steel Bar", "River Sand", "Aggregate 20mm", "Ready Mix Concrete",
    "PVC Pipe", "Copper Wire", "LED Panel", "Switch Board", "Wall Putty",
    "Exterior Paint", "Ceramic Tile", "Granite Slab", "Plywood Sheet", "Door Frame",
    "Window Glass", "Waterproofing Coat", "Adhesive Mortar", "GI Sheet", "Sanitary Fitting",
    "Modular Box", "Circuit Breaker", "Transport Charge", "Installation Service", "Site Consultation",
    "Excavation Work", "Scaffolding Rental", "Concrete Block", "Zigzag Paver", "Safety Helmet",
  ]
  return names.slice(0, count).map((name, index) => ({
    id: `prod_dev_${userId.slice(0, 8)}_${String(index + 1).padStart(3, "0")}`,
    user_id: userId,
    name,
    hsn: ["252329", "721420", "250590", "251710", "382450", "391723", "854449", "940540"][index % 8],
    unit: ["BAG", "KG", "TON", "CFT", "SQFT", "PCS", "MTR"][index % 7],
    price: 120 + index * 37,
    cgst: index % 5 === 0 ? 0 : 9,
    sgst: index % 5 === 0 ? 0 : 9,
    igst: 0,
    created_at: daysAgoIso(220 - index),
    updated_at: daysAgoIso(30 - (index % 20)),
    deleted_at: index === count - 1 ? daysAgoIso(2) : null,
    sync_status: index % 17 === 0 ? "conflict" : index % 13 === 0 ? "pending" : "synced",
    last_synced_at: index % 13 === 0 ? null : daysAgoIso(1),
  }))
}

function customerSeed(index) {
  const businesses = ["Aarav Buildcon", "Narmada Traders", "Vraj Infra", "Shreeji Interiors", "Patel Associates"]
  const individuals = ["Raj Mehta", "Nilesh Shah", "Kavya Desai", "Mira Patel", "Dev Joshi"]
  const business = index % 3 !== 0
  const name = business ? `${businesses[index % businesses.length]} ${index + 1}` : `${individuals[index % individuals.length]} ${index + 1}`
  const phone = `9${String(800000000 + index * 13729).slice(0, 9)}`
  const gst = business ? `24ABCDE${String(1000 + index).padStart(4, "0")}F1Z${index % 9}` : ""
  return {
    name,
    phone,
    email: `customer${index + 1}@example.test`,
    gst,
    address: `${10 + index}, Development Market, Vadodara, Gujarat`,
  }
}

function invoiceItems(products, invoiceIndex) {
  const first = products[invoiceIndex % products.length]
  const second = products[(invoiceIndex + 7) % products.length]
  return [first, second].map((product, index) => {
    const qty = index === 0 ? 2 + (invoiceIndex % 4) : 1
    const price = Number(product.price)
    const taxable = qty * price
    const tax = taxable * (Number(product.cgst) + Number(product.sgst) + Number(product.igst)) / 100
    return {
      product: product.name,
      hsn: product.hsn,
      qty,
      unit: product.unit,
      price,
      cgst: Number(product.cgst),
      sgst: Number(product.sgst),
      igst: Number(product.igst),
      total: Number((taxable + tax).toFixed(2)),
    }
  })
}

export function buildInvoices(userId, products, count) {
  const invoices = []
  for (let index = 0; index < count; index += 1) {
    const customer = customerSeed(index % 34)
    const monthOffset = index % 18
    const date = new Date(Date.UTC(2026, 5 - monthOffset, 1 + (index % 24)))
    const dateText = date.toISOString().slice(0, 10)
    const items = invoiceItems(products.filter((product) => !product.deleted_at), index)
    const grandTotal = Number(items.reduce((sum, item) => sum + item.total, 0).toFixed(2))
    const status = index % 9 === 0 ? "draft" : index % 4 === 0 ? "paid" : "issued"
    const phoneHash = lookupHash(customer.phone, "phone")
    const gstHash = lookupHash(customer.gst, "gst")
    invoices.push({
      id: `inv_dev_${userId.slice(0, 8)}_${String(index + 1).padStart(4, "0")}`,
      user_id: userId,
      invoice_number: `DEV-${String(index + 1).padStart(4, "0")}`,
      created_at: date.toISOString(),
      invoice_date: dateText,
      numbering_mode_at_creation: "financial-year-reset",
      reset_month_day_at_creation: "04-01",
      sequence_window_start: date.getUTCMonth() >= 3 ? `${date.getUTCFullYear()}-04-01` : `${date.getUTCFullYear() - 1}-04-01`,
      sequence_window_end: date.getUTCMonth() >= 3 ? `${date.getUTCFullYear() + 1}-04-01` : `${date.getUTCFullYear()}-04-01`,
      client_name: customer.name,
      client_phone: customer.phone,
      client_phone_hash: phoneHash || null,
      client_email: customer.email,
      client_gst: customer.gst,
      client_gst_hash: gstHash || null,
      customer_identity_key: customerIdentity(customer),
      client_address: customer.address,
      custom_details: [{ label: "Project", value: `DEV-SITE-${(index % 8) + 1}` }],
      notes: index % 5 === 0 ? "Seeded invoice for PDF and sync validation." : "",
      status,
      grand_total: grandTotal,
      updated_at: daysAgoIso(index % 20),
      deleted_at: index === count - 2 ? daysAgoIso(3) : null,
      sync_status: index % 23 === 0 ? "conflict" : index % 19 === 0 ? "pending" : "synced",
      last_synced_at: index % 19 === 0 ? null : daysAgoIso(1),
      items,
    })
  }
  return invoices
}

export function buildCustomers(userId, invoices) {
  const byIdentity = new Map()
  for (const invoice of invoices) {
    const identity = invoice.customer_identity_key
    if (!identity || byIdentity.has(identity)) continue
    byIdentity.set(identity, {
      id: `cust_dev_${crypto.createHash("sha1").update(`${userId}:${identity}`).digest("hex").slice(0, 16)}`,
      user_id: userId,
      identity_key: identity,
      identity_hash: identity,
      name: invoice.client_name,
      phone: invoice.client_phone,
      phone_hash: invoice.client_phone_hash,
      email: invoice.client_email,
      gst: invoice.client_gst,
      gst_hash: invoice.client_gst_hash,
      address: invoice.client_address,
      created_at: invoice.created_at,
      updated_at: invoice.updated_at,
      deleted_at: null,
      sync_status: "synced",
      last_synced_at: daysAgoIso(1),
    })
  }
  return [...byIdentity.values()]
}

export function daysAgoIso(days) {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() - days)
  return date.toISOString()
}

function defaultVisibility() {
  return {
    showBusinessLogo: true,
    showBusinessName: true,
    showBusinessPhone: true,
    showBusinessEmail: true,
    showBusinessGst: true,
    showBusinessAddress: true,
    showBankDetails: true,
    showTerms: true,
    showClientPhone: true,
    showClientEmail: true,
    showClientGst: true,
    showClientAddress: true,
  }
}

export async function ensureBuckets(admin) {
  const { data, error } = await admin.storage.listBuckets()
  if (error) throw error
  const buckets = new Set((data || []).map((bucket) => bucket.name))
  for (const bucket of [LOGO_BUCKET, PDF_BUCKET]) {
    if (!buckets.has(bucket)) throw new Error(`Required private storage bucket is missing: ${bucket}`)
  }
}

export async function deleteUserStorage(admin, userId) {
  for (const bucket of [LOGO_BUCKET, PDF_BUCKET]) {
    const paths = await listStoragePrefix(admin, bucket, userId)
    for (let i = 0; i < paths.length; i += 100) {
      const chunk = paths.slice(i, i + 100)
      if (chunk.length) {
        const { error } = await admin.storage.from(bucket).remove(chunk)
        if (error) throw error
      }
    }
  }
}

async function listStoragePrefix(admin, bucket, prefix) {
  const paths = []
  async function walk(current) {
    let offset = 0
    for (;;) {
      const { data, error } = await admin.storage.from(bucket).list(current, { limit: 1000, offset })
      if (error) throw error
      const entries = data || []
      for (const entry of entries) {
        const path = `${current}/${entry.name}`
        if (entry.id || entry.metadata) paths.push(path)
        else await walk(path)
      }
      if (entries.length < 1000) break
      offset += 1000
    }
  }
  await walk(prefix)
  return paths
}

export async function clearWorkspaceRows(admin, userId) {
  const { data: invoiceRows, error: invoiceError } = await admin.from("invoices").select("id").eq("user_id", userId)
  if (invoiceError) throw invoiceError
  const invoiceIds = (invoiceRows || []).map((row) => row.id)
  if (invoiceIds.length) {
    for (const table of ["invoice_history", "invoice_items"]) {
      const { error } = await admin.from(table).delete().in("invoice_id", invoiceIds)
      if (error) throw error
    }
  }
  for (const table of ["invoice_pdf_exports", "invoices", "invoice_sequences", "products", "customers", "profiles", "user_settings", "account_lifecycle_locks"]) {
    const { error } = await admin.from(table).delete().eq("user_id", userId)
    if (error) throw error
  }
}

export async function seedWorkspace(admin, account, options = {}) {
  const userId = account.userId
  const primary = options.kind !== "secondary"
  const productCount = primary ? 30 : 8
  const invoiceCount = primary ? 110 : 8
  const products = buildProducts(userId, productCount)
  const invoices = buildInvoices(userId, products, invoiceCount)
  const customers = buildCustomers(userId, invoices)
  const logoPath = `${userId}/logo-dev-${primary ? "primary" : "secondary"}.webp`
  const now = new Date().toISOString()

  await uploadObject(admin, LOGO_BUCKET, logoPath, Buffer.from("easyBILL dev logo", "utf8"), "image/webp")

  const profile = sealSensitiveFields({
    user_id: userId,
    business_name: primary ? "EasyBill Development Workspace" : "EasyBill Isolation Workspace",
    phone: primary ? "9876543210" : "9123456780",
    email: account.email,
    gst: primary ? "24ABCDE1234F1Z5" : "24ZXCVB4321F1Z2",
    address: primary ? "Development House, Vadodara, Gujarat" : "Isolation Lane, Ahmedabad, Gujarat",
    bank_name: "Development Bank",
    account_number: primary ? "123456789012" : "987654321012",
    ifsc: "DEVB0001234",
    upi: primary ? "easybill-dev@upi" : "easybill-isolation@upi",
    terms: "Seeded test data. Do not use for real business.",
    logo_storage_path: logoPath,
    logo_shape: primary ? "square" : "round",
    onboarding_completed: true,
    sync_status: "synced",
    last_synced_at: now,
  }, PROFILE_SENSITIVE_KEYS)

  const settings = {
    user_id: userId,
    date_format: "DD/MM/YYYY",
    amount_format: "indian",
    show_decimals: true,
    invoice_prefix: primary ? "DEV-" : "ISO-",
    invoice_padding: 4,
    invoice_start_number: 1,
    reset_yearly: true,
    invoice_reset_month_day: "04-01",
    currency_symbol: "₹",
    currency_position: "before",
    invoice_visibility: defaultVisibility(),
    invoice_template: primary ? "classic-default" : "modern-clean",
    template_typography: primary ? "serif" : "sans",
    template_font_id: primary ? "system" : "inter",
    template_font_size: primary ? 10 : 11,
    subscription_plan_id: "plus",
    invoice_usage_count: invoiceCount,
    invoice_usage_initialized: true,
    sync_status: "synced",
    last_synced_at: now,
  }

  const sealedProducts = products.map((row) => ({ ...row }))
  const sealedCustomers = customers.map((row) => sealSensitiveFields(row, CUSTOMER_SENSITIVE_KEYS))
  const sealedInvoices = invoices.map((row) => {
    const invoice = { ...row }
    delete invoice.items
    return sealSensitiveFields(invoice, INVOICE_SENSITIVE_KEYS)
  })
  const itemRows = invoices.flatMap((invoice) => invoice.items.map((item, index) => ({
    invoice_id: invoice.id,
    position: index,
    product: item.product,
    hsn: item.hsn,
    qty: item.qty,
    unit: item.unit,
    price: item.price,
    cgst: item.cgst,
    sgst: item.sgst,
    igst: item.igst,
    total: item.total,
    sync_status: "synced",
    last_synced_at: now,
  })))
  const historyRows = invoices.flatMap((invoice, index) => ([
    {
      id: `hist_${invoice.id}_created`,
      invoice_id: invoice.id,
      event_type: "created",
      label: "Invoice created",
      happened_at: invoice.created_at,
      sync_status: "synced",
      last_synced_at: now,
    },
    ...(index % 6 === 0 ? [{
      id: `hist_${invoice.id}_edited`,
      invoice_id: invoice.id,
      event_type: "edited",
      label: "Seeded edit for validation",
      happened_at: invoice.updated_at,
      sync_status: "synced",
      last_synced_at: now,
    }] : []),
    ...(invoice.status === "paid" ? [{
      id: `hist_${invoice.id}_paid`,
      invoice_id: invoice.id,
      event_type: "status",
      label: "Marked paid",
      happened_at: invoice.updated_at,
      sync_status: "synced",
      last_synced_at: now,
    }] : []),
  ]))

  await checked(admin.from("profiles").upsert(profile, { onConflict: "user_id" }), "profile upsert")
  await checked(admin.from("user_settings").upsert(settings, { onConflict: "user_id" }), "settings upsert")
  await checked(admin.from("products").upsert(sealedProducts, { onConflict: "id" }), "products upsert")
  await checked(admin.from("customers").upsert(sealedCustomers, { onConflict: "id" }), "customers upsert")
  await checked(admin.from("invoices").upsert(sealedInvoices, { onConflict: "id" }), "invoices upsert")
  await checked(admin.from("invoice_items").insert(itemRows), "invoice items insert")
  await checked(admin.from("invoice_history").insert(historyRows), "invoice history insert")
  await seedPdfExports(admin, userId, invoices.slice(0, primary ? 12 : 2))
  await checked(admin.from("account_lifecycle_locks").upsert({
    user_id: userId,
    operation: "idle",
    account_deleting: false,
    locked_at: null,
    last_error: null,
  }, { onConflict: "user_id" }), "lifecycle lock upsert")
}

async function seedPdfExports(admin, userId, invoices) {
  const rows = []
  for (const invoice of invoices) {
    const storagePath = `${userId}/seeded/${invoice.id}.pdf`
    await uploadObject(admin, PDF_BUCKET, storagePath, PDF_BYTES, "application/pdf")
    rows.push({
      user_id: userId,
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
      source_fingerprint: `seed-${invoice.id}`,
      storage_path: storagePath,
      generated_at: invoice.updated_at,
      last_accessed_at: null,
      created_at: invoice.updated_at,
    })
  }
  await checked(admin.from("invoice_pdf_exports").upsert(rows, { onConflict: "user_id,invoice_id,source_fingerprint" }), "PDF export rows upsert")
}

async function uploadObject(admin, bucket, path, body, contentType) {
  await admin.storage.from(bucket).remove([path]).catch(() => {})
  const { error } = await admin.storage.from(bucket).upload(path, body, { contentType, upsert: true })
  if (error) throw error
}

async function checked(query, label) {
  const { error } = await query
  if (error) throw new Error(`${label} failed: ${error.message}`)
}

export async function resetAndSeed(admin, account, options = {}) {
  await assertAccountMatches(admin, account, options.kind === "secondary" ? "Secondary" : "Primary")
  await ensureBuckets(admin)
  await deleteUserStorage(admin, account.userId)
  await clearWorkspaceRows(admin, account.userId)
  await seedWorkspace(admin, account, options)
}

export async function validateWorkspace(env, admin) {
  await assertAccountMatches(admin, env.primary, "Primary")
  await assertAccountMatches(admin, env.secondary, "Secondary")
  await ensureBuckets(admin)
  const primary = await collectHealth(admin, env.primary.userId)
  const secondary = await collectHealth(admin, env.secondary.userId)
  const failures = []

  if (primary.products < 25) failures.push(`Primary product count too low: ${primary.products}`)
  if (primary.invoices < 100) failures.push(`Primary invoice count too low: ${primary.invoices}`)
  if (primary.history < 100) failures.push(`Primary invoice history count too low: ${primary.history}`)
  if (primary.pdfExports < 5) failures.push(`Primary PDF export count too low: ${primary.pdfExports}`)
  if (secondary.products < 5) failures.push(`Secondary product count too low: ${secondary.products}`)
  if (secondary.invoices < 5) failures.push(`Secondary invoice count too low: ${secondary.invoices}`)
  if (secondary.pdfExports < 1) failures.push(`Secondary PDF export count too low: ${secondary.pdfExports}`)
  if (!primary.logoPaths.every((path) => path.startsWith(`${env.primary.userId}/`))) failures.push("Primary logo paths are not user scoped.")
  if (!secondary.logoPaths.every((path) => path.startsWith(`${env.secondary.userId}/`))) failures.push("Secondary logo paths are not user scoped.")
  if (await secondaryCanSeePrimaryProduct(env, primary.firstProductId)) failures.push("Secondary account can see a primary product through RLS.")

  return { ok: failures.length === 0, failures, primary, secondary }
}

async function collectHealth(admin, userId) {
  const [products, invoices, history, pdfExports, profile] = await Promise.all([
    countRows(admin, "products", userId),
    countRows(admin, "invoices", userId),
    countInvoiceHistory(admin, userId),
    countRows(admin, "invoice_pdf_exports", userId),
    admin.from("profiles").select("logo_storage_path").eq("user_id", userId).maybeSingle(),
  ])
  const firstProduct = await admin.from("products").select("id").eq("user_id", userId).limit(1).maybeSingle()
  return {
    products,
    invoices,
    history,
    pdfExports,
    logoPaths: [profile.data?.logo_storage_path].filter(Boolean),
    firstProductId: firstProduct.data?.id || "",
  }
}

async function countRows(admin, table, userId) {
  const { count, error } = await admin.from(table).select("*", { count: "exact", head: true }).eq("user_id", userId)
  if (error) throw error
  return count || 0
}

async function countInvoiceHistory(admin, userId) {
  const { data: invoices, error: invoiceError } = await admin.from("invoices").select("id").eq("user_id", userId)
  if (invoiceError) throw invoiceError
  const ids = (invoices || []).map((row) => row.id)
  if (!ids.length) return 0
  const { count, error } = await admin.from("invoice_history").select("*", { count: "exact", head: true }).in("invoice_id", ids)
  if (error) throw error
  return count || 0
}

async function secondaryCanSeePrimaryProduct(env, productId) {
  if (!productId) return false
  const client = createAnon(env)
  const { error: signInError } = await client.auth.signInWithPassword({
    email: env.secondary.email,
    password: env.secondary.password,
  })
  if (signInError) throw signInError
  const { data, error } = await client.from("products").select("id").eq("id", productId)
  if (error) throw error
  return (data || []).length > 0
}
