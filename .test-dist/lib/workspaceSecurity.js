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
];
export function redactSensitiveValue(key, value) {
    if (!SENSITIVE_KEYS.some((sensitiveKey) => sensitiveKey.toLowerCase() === key.toLowerCase()))
        return value;
    if (value == null || value === "")
        return value;
    return "[REDACTED]";
}
export function redactSensitiveData(value) {
    if (Array.isArray(value)) {
        return value.map((item) => redactSensitiveData(item));
    }
    if (typeof value !== "object" || value === null)
        return value;
    const next = {};
    for (const [key, entryValue] of Object.entries(value)) {
        next[key] = redactSensitiveValue(key, redactSensitiveData(entryValue));
    }
    return next;
}
export const consoleSyncLogger = {
    info(message, details) {
        console.info(message, details ? redactSensitiveData(details) : undefined);
    },
    warn(message, details) {
        console.warn(message, details ? redactSensitiveData(details) : undefined);
    },
    error(message, details) {
        console.error(message, details ? redactSensitiveData(details) : undefined);
    },
};
