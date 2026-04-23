export const EMPTY_BUSINESS_PROFILE = {
    businessName: "",
    phone: "",
    email: "",
    gst: "",
    address: "",
    bankName: "",
    accountNumber: "",
    ifsc: "",
    upi: "",
    terms: "",
    logo: "",
    logoStoragePath: "",
    logoShape: "square",
};
export function normalizeBusinessProfile(value) {
    const parsed = typeof value === "object" && value !== null ? value : {};
    return {
        businessName: parsed.businessName || "",
        phone: parsed.phone || "",
        email: parsed.email || "",
        gst: parsed.gst || "",
        address: parsed.address || "",
        bankName: parsed.bankName || "",
        accountNumber: parsed.accountNumber || "",
        ifsc: parsed.ifsc || "",
        upi: parsed.upi || "",
        terms: typeof parsed.terms === "string" ? parsed.terms : "",
        logo: parsed.logo || "",
        logoStoragePath: typeof parsed.logoStoragePath === "string" ? parsed.logoStoragePath : "",
        logoShape: parsed.logoShape === "round" ? "round" : "square",
    };
}
export function readNormalizedBusinessProfileFromStorage() {
    if (typeof window === "undefined")
        return EMPTY_BUSINESS_PROFILE;
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { getActiveOrGlobalItem } = require("@/lib/userStore");
        const raw = getActiveOrGlobalItem("businessProfile");
        if (!raw)
            return EMPTY_BUSINESS_PROFILE;
        return normalizeBusinessProfile(JSON.parse(raw));
    }
    catch {
        return EMPTY_BUSINESS_PROFILE;
    }
}
