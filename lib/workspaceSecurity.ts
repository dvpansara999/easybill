const SENSITIVE_KEYS = [
  "account_number",
  "accountNumber",
  "bank_name",
  "bankName",
  "client_gst",
  "clientGST",
  "client_phone",
  "clientPhone",
  "gst",
  "ifsc",
  "phone",
  "upi",
] as const

export function redactSensitiveValue(key: string, value: unknown) {
  if (!SENSITIVE_KEYS.some((sensitiveKey) => sensitiveKey.toLowerCase() === key.toLowerCase())) return value
  if (value == null || value === "") return value
  return "[REDACTED]"
}

export function redactSensitiveData<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveData(item)) as T
  }

  if (typeof value !== "object" || value === null) return value

  const next: Record<string, unknown> = {}
  for (const [key, entryValue] of Object.entries(value)) {
    next[key] = redactSensitiveValue(key, redactSensitiveData(entryValue))
  }
  return next as T
}

export type SyncLogger = {
  info(message: string, details?: Record<string, unknown>): void
  warn(message: string, details?: Record<string, unknown>): void
  error(message: string, details?: Record<string, unknown>): void
}

export const consoleSyncLogger: SyncLogger = {
  info(message, details) {
    console.info(message, details ? redactSensitiveData(details) : undefined)
  },
  warn(message, details) {
    console.warn(message, details ? redactSensitiveData(details) : undefined)
  },
  error(message, details) {
    console.error(message, details ? redactSensitiveData(details) : undefined)
  },
}
