function normalizeWhitespace(value) {
    return value.replace(/\s+/g, " ").trim();
}
export function normalizeCustomerPhone(value) {
    const raw = normalizeWhitespace(String(value || ""));
    if (!raw)
        return "";
    return raw.replace(/[^\d+()-\s]/g, "").replace(/\s+/g, " ").trim();
}
export function normalizeCustomerGstin(value) {
    return normalizeWhitespace(String(value || "")).toUpperCase();
}
function normalizeLegacyValue(value) {
    return normalizeWhitespace(String(value || "")).toLowerCase();
}
function hashString(input) {
    let hash = 2166136261;
    for (let i = 0; i < input.length; i += 1) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
}
export function buildCustomerIdentity(invoice) {
    const phone = normalizeCustomerPhone(invoice.clientPhone);
    if (phone) {
        return { id: `phone:${phone}`, kind: "phone" };
    }
    const gstin = normalizeCustomerGstin(invoice.clientGST);
    if (gstin) {
        return { id: `gst:${gstin}`, kind: "gst" };
    }
    const legacySeed = JSON.stringify({
        name: normalizeLegacyValue(invoice.clientName),
        email: normalizeLegacyValue(invoice.clientEmail),
        address: normalizeLegacyValue(invoice.clientAddress),
    });
    return { id: `legacy:${hashString(legacySeed)}`, kind: "legacy" };
}
export function matchesCustomerIdentity(invoice, identity) {
    return buildCustomerIdentity(invoice).id === identity;
}
