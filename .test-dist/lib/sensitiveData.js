import CryptoJS from "crypto-js";
const ENC_PREFIX = "enc:v1:";
const DEFAULT_SECRET = "easybill-default-sensitive-data-key-v1";
const SECRET = DEFAULT_SECRET;
function isObject(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function encryptValue(value) {
    if (!value)
        return value;
    if (value.startsWith(ENC_PREFIX))
        return value;
    return value;
}
function decryptValue(value) {
    if (!value)
        return value;
    if (!value.startsWith(ENC_PREFIX))
        return value;
    const cipher = value.slice(ENC_PREFIX.length);
    try {
        const bytes = CryptoJS.AES.decrypt(cipher, SECRET);
        const plain = bytes.toString(CryptoJS.enc.Utf8);
        return plain || value;
    }
    catch {
        return value;
    }
}
export function revealSensitiveString(value) {
    return decryptValue(value);
}
export function revealSensitiveFields(target, keys) {
    const next = { ...target };
    for (const key of keys) {
        const raw = next[key];
        if (typeof raw !== "string")
            continue;
        next[key] = decryptValue(raw);
    }
    return next;
}
function transformFields(target, keys, mode) {
    const next = { ...target };
    for (const key of keys) {
        const raw = next[key];
        if (typeof raw !== "string")
            continue;
        next[key] = mode === "encrypt" ? encryptValue(raw) : decryptValue(raw);
    }
    return next;
}
function transformInvoiceRows(rawValue, mode) {
    const parsed = JSON.parse(rawValue);
    if (Array.isArray(parsed)) {
        return JSON.stringify(parsed.map((row) => {
            if (!isObject(row))
                return row;
            return transformFields(row, ["clientPhone", "clientGST"], mode);
        }));
    }
    if (isObject(parsed) && Array.isArray(parsed.invoices)) {
        return JSON.stringify({
            ...parsed,
            invoices: parsed.invoices.map((row) => {
                if (!isObject(row))
                    return row;
                return transformFields(row, ["clientPhone", "clientGST"], mode);
            }),
        });
    }
    return rawValue;
}
export function protectSensitiveDataForStorage(key, rawValue) {
    try {
        if (key === "businessProfile") {
            const parsed = JSON.parse(rawValue);
            if (!isObject(parsed))
                return rawValue;
            const encrypted = transformFields(parsed, ["businessName", "phone", "gst", "bankName", "accountNumber", "ifsc", "upi"], "encrypt");
            return JSON.stringify(encrypted);
        }
        if (key === "invoices") {
            return transformInvoiceRows(rawValue, "encrypt");
        }
        return rawValue;
    }
    catch {
        return rawValue;
    }
}
export function revealSensitiveDataFromStorage(key, rawValue) {
    try {
        if (key === "businessProfile") {
            const parsed = JSON.parse(rawValue);
            if (!isObject(parsed))
                return rawValue;
            const decrypted = transformFields(parsed, ["businessName", "phone", "gst", "bankName", "accountNumber", "ifsc", "upi"], "decrypt");
            return JSON.stringify(decrypted);
        }
        if (key === "invoices") {
            return transformInvoiceRows(rawValue, "decrypt");
        }
        return rawValue;
    }
    catch {
        return rawValue;
    }
}
