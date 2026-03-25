const SAFE_INVOICE_PREFIX_PATTERN = /^[A-Za-z0-9._,:;()\-]*$/

export function getInvoicePrefixError(prefix: string) {
  if (prefix !== prefix.trim()) {
    return "Invoice prefix cannot start or end with a space."
  }

  if (/\s/.test(prefix)) {
    return "Invoice prefix cannot contain spaces. Use letters, numbers, or symbols like -, _, ., (, )."
  }

  if (!SAFE_INVOICE_PREFIX_PATTERN.test(prefix)) {
    return "Invoice prefix contains unsupported characters. Use only letters, numbers, and these symbols: - _ . , : ; ( )"
  }

  return ""
}
