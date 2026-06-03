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
] as const

export type ProfileRequiredTextField = (typeof PROFILE_REQUIRED_TEXT_FIELDS)[number]

export type ProfileTextPatchInput = Partial<Record<ProfileRequiredTextField, unknown>>

export function normalizeProfileTextValue(value: unknown) {
  return typeof value === "string" ? value : ""
}

export function normalizeProfileTextPatch(input: ProfileTextPatchInput) {
  return PROFILE_REQUIRED_TEXT_FIELDS.reduce(
    (patch, field) => {
      patch[field] = normalizeProfileTextValue(input[field])
      return patch
    },
    {} as Record<ProfileRequiredTextField, string>
  )
}

export function normalizeProfileLogoShape(value: unknown): "square" | "round" {
  return value === "round" ? "round" : "square"
}
