export const PROFILE_REQUIRED_TEXT_FIELDS = [
    "business_name",
    "phone",
    "email",
    "gst",
    "address",
    "bank_name",
    "account_number",
    "ifsc",
    "upi",
    "terms",
];
export function normalizeProfileTextValue(value) {
    return typeof value === "string" ? value : "";
}
export function normalizeProfileTextPatch(input) {
    return PROFILE_REQUIRED_TEXT_FIELDS.reduce((patch, field) => {
        patch[field] = normalizeProfileTextValue(input[field]);
        return patch;
    }, {});
}
export function normalizeProfileLogoShape(value) {
    return value === "round" ? "round" : "square";
}
