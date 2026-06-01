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
    return normalizeWhitespace(String(value || "")).toUpperCase().replace(/[^0-9A-Z]/g, "");
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
function buildPlainCustomerIdentity(invoice) {
    const sealedIdentity = invoice.customerIdentityKey;
    if (typeof sealedIdentity === "string" && /^(phone|gst|legacy):/.test(sealedIdentity)) {
        return { id: sealedIdentity, kind: sealedIdentity.split(":", 1)[0] };
    }
    return buildLegacyCustomerIdentity(invoice);
}
function buildLegacyCustomerIdentity(invoice) {
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
export function buildCustomerIdentity(invoice) {
    return buildPlainCustomerIdentity(invoice);
}
export function matchesCustomerIdentity(invoice, identity) {
    return buildCustomerIdentity(invoice).id === identity || buildLegacyCustomerIdentity(invoice).id === identity;
}
