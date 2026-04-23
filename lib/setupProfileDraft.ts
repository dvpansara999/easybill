export type SetupProfileDraft = {
  businessName: string
  address: string
  gst: string
  phone: string
  email: string
  emailLocked: boolean
  bankName: string
  accountNumber: string
  ifsc: string
  upi: string
  terms: string
  logo: string
  logoStoragePath?: string
  logoShape: "square" | "round"
  logoSource: string
  logoZoom: number
  logoOffsetX: number
  logoOffsetY: number
}

export const emptySetupProfileDraft: SetupProfileDraft = {
  businessName: "",
  address: "",
  gst: "",
  phone: "",
  email: "",
  emailLocked: false,
  bankName: "",
  accountNumber: "",
  ifsc: "",
  upi: "",
  terms: "",
  logo: "",
  logoStoragePath: "",
  logoShape: "square",
  logoSource: "",
  logoZoom: 1,
  logoOffsetX: 50,
  logoOffsetY: 50,
}

const setupDraftKey = "setupProfileDraft"

export function getSetupProfileDraft(): SetupProfileDraft {
  if (typeof window === "undefined") {
    return emptySetupProfileDraft
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getActiveOrGlobalItem } = require("@/lib/userStore") as typeof import("@/lib/userStore")
  const stored = getActiveOrGlobalItem(setupDraftKey)
  if (!stored) {
    return emptySetupProfileDraft
  }

  const parsed = JSON.parse(stored)

  return {
    ...emptySetupProfileDraft,
    ...parsed,
  }
}

export function saveSetupProfileDraft(draft: SetupProfileDraft) {
  if (typeof window === "undefined") {
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { setActiveOrGlobalItem } = require("@/lib/userStore") as typeof import("@/lib/userStore")
  setActiveOrGlobalItem(setupDraftKey, JSON.stringify(draft))
}

export function clearSetupProfileDraft() {
  if (typeof window === "undefined") {
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { removeActiveOrGlobalItem } = require("@/lib/userStore") as typeof import("@/lib/userStore")
  removeActiveOrGlobalItem(setupDraftKey)
}
