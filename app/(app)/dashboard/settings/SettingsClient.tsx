"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSettings } from "@/context/SettingsContext"
import { buildInvoiceNumberPreviewSeries, generateInvoiceNumber, getFirstRepeatedInvoiceNumberWarning } from "@/lib/invoiceNumber"
import { getInvoicePrefixError } from "@/lib/invoicePrefixValidation"
import { formatResetMonthLabel, RESET_MONTH_DAY_OPTIONS } from "@/lib/invoiceResetDate"
import {
  getActiveAuthRecord,
  requestEmailChangeOtp,
  signInWithOtp,
  updatePasswordAfterOtp,
  verifyEmailChangeOtp,
  verifyEmailOtp,
} from "@/lib/auth"
import { flushCloudKeyNow, setActiveOrGlobalItem } from "@/lib/userStore"
import { getSupabaseUser } from "@/lib/supabase/browser"
import SelectMenu from "@/components/ui/SelectMenu"
import { readStoredInvoices, type InvoiceRecord } from "@/lib/invoice"
import { useAppAlert } from "@/components/providers/AppAlertProvider"
import { requestGuardedNavigation, useUnsavedChangesGuard } from "@/lib/unsavedChangesGuard"
import { downloadAppBackupJson, importAppBackupJson } from "@/lib/appBackup"

type EmailChangePolicy = {
  canChange: boolean
  cooldownDays: number
  remainingDays: number
  lockUntil: string
  basedOn: "account_created_at" | "last_email_change"
}

export default function SettingsClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const setupMode = searchParams.get("setup") === "1"
  const { showAlert } = useAppAlert()

  const {
    dateFormat,
    updateDateFormat,
    amountFormat,
    updateAmountFormat,
    showDecimals,
    updateShowDecimals,
    invoicePrefix,
    updateInvoicePrefix,
    invoicePadding,
    updateInvoicePadding,
    invoiceStartNumber,
    updateInvoiceStartNumber,
    resetYearly,
    updateResetYearly,
    invoiceResetMonthDay,
    updateInvoiceResetMonthDay,
    currencySymbol,
    updateCurrencySymbol,
    currencyPosition,
    updateCurrencyPosition,
  } = useSettings()

  const [draftDateFormat, setDraftDateFormat] = useState(dateFormat)
  const [draftAmountFormat, setDraftAmountFormat] = useState(amountFormat)
  const [draftShowDecimals, setDraftShowDecimals] = useState(showDecimals)
  const [draftInvoicePrefix, setDraftInvoicePrefix] = useState(invoicePrefix)
  const [draftInvoicePadding, setDraftInvoicePadding] = useState(invoicePadding)
  const [draftInvoiceStartNumber, setDraftInvoiceStartNumber] = useState(invoiceStartNumber)
  const [draftResetYearly, setDraftResetYearly] = useState(resetYearly)
  const [draftInvoiceResetMonthDay, setDraftInvoiceResetMonthDay] = useState(invoiceResetMonthDay)
  const [draftCurrencySymbol, setDraftCurrencySymbol] = useState(currencySymbol)
  const [draftCurrencyPosition, setDraftCurrencyPosition] = useState(currencyPosition)
  const [ready, setReady] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")
  const [invoiceHistory, setInvoiceHistory] = useState<InvoiceRecord[]>([])
  const [accountEmail, setAccountEmail] = useState("")
  const [accountUserId, setAccountUserId] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)
  const [accountMessage, setAccountMessage] = useState("")
  const [accountError, setAccountError] = useState("")
  const [showEmailEditor, setShowEmailEditor] = useState(false)
  const [showPasswordEditor, setShowPasswordEditor] = useState(false)
  const [emailChangeStep, setEmailChangeStep] = useState<"password" | "otp">("password")
  const [emailOtpCode, setEmailOtpCode] = useState("")
  const [emailChangeBusy, setEmailChangeBusy] = useState(false)
  const [passwordOtpBusy, setPasswordOtpBusy] = useState(false)
  const [updatePasswordBusy, setUpdatePasswordBusy] = useState(false)
  const [passwordOtpSent, setPasswordOtpSent] = useState(false)
  const [passwordOtpCode, setPasswordOtpCode] = useState("")
  const [passwordOtpVerified, setPasswordOtpVerified] = useState(false)
  const [emailPolicy, setEmailPolicy] = useState<EmailChangePolicy | null>(null)
  const [emailPolicyLoading, setEmailPolicyLoading] = useState(true)
  const [prefixErrorMessage, setPrefixErrorMessage] = useState("")
  const [savingSettings, setSavingSettings] = useState(false)
  const [backupBusy, setBackupBusy] = useState<null | "export" | "import">(null)
  const importInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    router.prefetch("/dashboard")
    router.prefetch("/dashboard/settings/report")
    router.prefetch("/dashboard/settings/invoice-visibility")
  }, [router])

  async function refreshEmailPolicy() {
    setEmailPolicyLoading(true)
    try {
      const res = await fetch("/api/account/email-change-policy", {
        method: "GET",
        cache: "no-store",
      })
      if (!res.ok) throw new Error("policy-fetch-failed")
      const data = (await res.json()) as EmailChangePolicy
      setEmailPolicy(data)
      return data
    } catch {
      setEmailPolicy(null)
      return null
    } finally {
      setEmailPolicyLoading(false)
    }
  }

  useEffect(() => {
    setDraftDateFormat(dateFormat)
    setDraftAmountFormat(amountFormat)
    setDraftShowDecimals(showDecimals)
    setDraftInvoicePrefix(invoicePrefix)
    setDraftInvoicePadding(invoicePadding)
    setDraftInvoiceStartNumber(invoiceStartNumber)
    setDraftResetYearly(resetYearly)
    setDraftInvoiceResetMonthDay(invoiceResetMonthDay)
    setDraftCurrencySymbol(currencySymbol)
    setDraftCurrencyPosition(currencyPosition)

    setInvoiceHistory(readStoredInvoices())
    setReady(true)
  }, [
    dateFormat,
    amountFormat,
    showDecimals,
    invoicePrefix,
    invoicePadding,
    invoiceStartNumber,
    resetYearly,
    invoiceResetMonthDay,
    currencySymbol,
    currencyPosition,
  ])

  useEffect(() => {
    const auth = getActiveAuthRecord()
    if (auth) {
      setAccountEmail(auth.email || "")
      setAccountUserId(auth.userId)
      setNewEmail(auth.email || "")
      void refreshEmailPolicy()
      void (async () => {
        try {
          const { data } = await getSupabaseUser()
          const supabaseEmail = data.user?.email || ""
          if (supabaseEmail) {
            setAccountEmail(supabaseEmail)
            setNewEmail(supabaseEmail)
          }
        } catch {
          // ignore
        }
      })()
    }
    setReady(true)
  }, [])

  const selectStyle =
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"

  const invoicePreview = useMemo(() => {
    return generateInvoiceNumber(
      invoiceHistory,
      draftInvoicePrefix,
      draftInvoicePadding,
      Math.max(1, Number.isFinite(draftInvoiceStartNumber) ? draftInvoiceStartNumber : 1),
      draftResetYearly,
      draftInvoiceResetMonthDay
    )
  }, [invoiceHistory, draftInvoicePrefix, draftInvoicePadding, draftInvoiceStartNumber, draftResetYearly, draftInvoiceResetMonthDay])
  const duplicateCycleWarning = useMemo(() => {
    return getFirstRepeatedInvoiceNumberWarning(
      invoiceHistory,
      {
        prefix: draftInvoicePrefix,
        padding: draftInvoicePadding,
        startNumber: Math.max(1, Number.isFinite(draftInvoiceStartNumber) ? draftInvoiceStartNumber : 1),
        resetYearly: draftResetYearly,
        resetMonthDay: draftInvoiceResetMonthDay,
      }
    )
  }, [
    draftInvoicePadding,
    draftInvoicePrefix,
    draftInvoiceResetMonthDay,
    draftInvoiceStartNumber,
    draftResetYearly,
    invoiceHistory,
  ])
  const invoicePrefixError = getInvoicePrefixError(draftInvoicePrefix)
  const invoicePreviewSeries = useMemo(() => {
    return buildInvoiceNumberPreviewSeries(
      invoiceHistory,
      {
        prefix: draftInvoicePrefix,
        padding: draftInvoicePadding,
        startNumber: Math.max(1, Number.isFinite(draftInvoiceStartNumber) ? draftInvoiceStartNumber : 1),
        resetYearly: draftResetYearly,
        resetMonthDay: draftInvoiceResetMonthDay,
      },
      3
    )
  }, [
    draftInvoicePadding,
    draftInvoicePrefix,
    draftInvoiceResetMonthDay,
    draftInvoiceStartNumber,
    draftResetYearly,
    invoiceHistory,
  ])
  const numberingScopeNotice =
    invoiceHistory.length > 0 &&
    (draftInvoicePrefix !== invoicePrefix ||
      draftResetYearly !== resetYearly ||
      draftInvoiceResetMonthDay !== invoiceResetMonthDay)
      ? "This only affects future invoices. Existing invoice numbers stay exactly as they were issued."
      : ""

  const hasPendingChanges =
    draftDateFormat !== dateFormat ||
    draftAmountFormat !== amountFormat ||
    draftShowDecimals !== showDecimals ||
    draftInvoicePrefix !== invoicePrefix ||
    draftInvoicePadding !== invoicePadding ||
    draftInvoiceStartNumber !== invoiceStartNumber ||
    draftResetYearly !== resetYearly ||
    draftInvoiceResetMonthDay !== invoiceResetMonthDay ||
    draftCurrencySymbol !== currencySymbol ||
    draftCurrencyPosition !== currencyPosition

  const passwordIsValid =
    /[A-Z]/.test(newPassword) &&
    /[a-z]/.test(newPassword) &&
    /\d/.test(newPassword) &&
    /[^A-Za-z0-9]/.test(newPassword) &&
    newPassword.length >= 7 &&
    newPassword.length <= 20

  const newEmailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())

  const resetDraftsFromSaved = useCallback(() => {
    setDraftDateFormat(dateFormat)
    setDraftAmountFormat(amountFormat)
    setDraftShowDecimals(showDecimals)
    setDraftInvoicePrefix(invoicePrefix)
    setDraftInvoicePadding(invoicePadding)
    setDraftInvoiceStartNumber(invoiceStartNumber)
    setDraftResetYearly(resetYearly)
    setDraftInvoiceResetMonthDay(invoiceResetMonthDay)
    setDraftCurrencySymbol(currencySymbol)
    setDraftCurrencyPosition(currencyPosition)
    setPrefixErrorMessage("")
    setSaveMessage("")
  }, [
    amountFormat,
    currencyPosition,
    currencySymbol,
    dateFormat,
    invoicePadding,
    invoicePrefix,
    invoiceResetMonthDay,
    invoiceStartNumber,
    resetYearly,
    showDecimals,
  ])

  async function saveChanges(options?: { navigateAfterSave?: boolean }) {
    if (invoicePrefixError) {
      setPrefixErrorMessage(invoicePrefixError)
      showAlert({
        tone: "danger",
        title: "Invalid invoice prefix",
        actionHint: "Use only supported characters, then save again.",
        message: invoicePrefixError,
      })
      return false
    }

    setPrefixErrorMessage("")
    setSavingSettings(true)
    updateDateFormat(draftDateFormat)
    updateAmountFormat(draftAmountFormat)
    updateShowDecimals(draftShowDecimals)
    updateInvoicePrefix(draftInvoicePrefix)
    updateInvoicePadding(draftInvoicePadding)
    updateInvoiceStartNumber(Math.max(1, draftInvoiceStartNumber || 1))
    updateResetYearly(draftResetYearly)
    updateInvoiceResetMonthDay(draftInvoiceResetMonthDay)
    updateCurrencySymbol(draftCurrencySymbol)
    updateCurrencyPosition(draftCurrencyPosition)

    await new Promise((resolve) => window.setTimeout(resolve, 120))

    if (setupMode && options?.navigateAfterSave !== false) {
      setSavingSettings(false)
      router.push("/dashboard")
      return true
    }

    setSaveMessage("Changes saved.")
    setSavingSettings(false)
    window.setTimeout(() => setSaveMessage(""), 2000)
    return true
  }

  useUnsavedChangesGuard({
    hasUnsavedChanges: hasPendingChanges,
    onApply: () => saveChanges({ navigateAfterSave: false }),
    onRevert: resetDraftsFromSaved,
    actionHint: "Apply your settings before leaving, or revert them and continue.",
    message: "You changed invoice settings on this page.",
  })

  async function updateEmailOnly() {
    setAccountMessage("")
    setAccountError("")

    const auth = getActiveAuthRecord()
    if (!auth) {
      setAccountError("No account credentials found yet. Create an account first.")
      return
    }

    if (!currentPassword) {
      setAccountError("Enter your current password to continue.")
      return
    }

    let sourceEmail = (accountEmail || auth.email || "").trim().toLowerCase()
    try {
      const { data } = await getSupabaseUser()
      const supabaseEmail = (data.user?.email || "").trim().toLowerCase()
      if (supabaseEmail) {
        sourceEmail = supabaseEmail
        setAccountEmail(data.user?.email || "")
      }
    } catch {
      // Keep local fallback when network check fails.
    }

    const wantsEmailChange = newEmail.trim().toLowerCase() !== sourceEmail
    if (!wantsEmailChange) {
      setAccountError("New login email cannot be same as current login email.")
      return
    }

    if (emailChangeStep === "password") {
      if (!newEmailIsValid) {
        setAccountError("Enter a valid email address.")
        return
      }

      const policy = await refreshEmailPolicy()
      if (!policy?.canChange) {
        setAccountError(
          policy
            ? `Email can be changed once every ${policy.cooldownDays} days. Try again in ${policy.remainingDays} day(s).`
            : "Error occurred, try again."
        )
        return
      }

      setEmailChangeBusy(true)
      const { error } = await requestEmailChangeOtp({
        currentPassword,
        newEmail: newEmail.trim(),
      })
      setEmailChangeBusy(false)
      if (error) {
        setAccountError(error)
        return
      }
      setEmailChangeStep("otp")
      setEmailOtpCode("")
      setAccountMessage("OTP sent to your new email. Enter OTP to verify.")
      return
    }

    if (emailOtpCode.trim().length < 6) {
      setAccountError("Enter 6-digit OTP.")
      return
    }

    setEmailChangeBusy(true)
    const { record, error } = await verifyEmailChangeOtp(newEmail.trim(), emailOtpCode.trim())
    setEmailChangeBusy(false)
    if (error || !record) {
      setAccountError(error || "Unable to verify OTP.")
      return
    }

    setActiveOrGlobalItem("emailChangeAudit", "1")
    try {
      await flushCloudKeyNow("emailChangeAudit")
    } catch {
      // Non-blocking
    }
    await refreshEmailPolicy()

    setAccountEmail(record.email)
    setAccountUserId(record.userId)
    setNewEmail(record.email)
    setCurrentPassword("")
    setEmailChangeStep("password")
    setEmailOtpCode("")
    setShowEmailEditor(false)
    setAccountMessage("Login email updated.")
    window.setTimeout(() => setAccountMessage(""), 2000)
  }

  async function updatePasswordOnly() {
    setAccountMessage("")
    setAccountError("")

    const auth = getActiveAuthRecord()
    if (!auth) {
      setAccountError("No account credentials found yet. Create an account first.")
      return
    }

    if (!passwordOtpVerified) {
      setAccountError("Verify OTP first.")
      return
    }

    if (!newPassword) {
      setAccountError("New password is required.")
      return
    }
    if (!passwordIsValid) {
      setAccountError("Use 7-20 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character.")
      return
    }
    if (newPassword !== confirmNewPassword) {
      setAccountError("New passwords must match exactly.")
      return
    }

    setUpdatePasswordBusy(true)
    const { record, error } = await updatePasswordAfterOtp(newPassword)
    setUpdatePasswordBusy(false)

    if (error || !record) {
      setAccountError(error || "Unable to update password.")
      return
    }

    setAccountEmail(record.email)
    setAccountUserId(record.userId)
    setPasswordOtpCode("")
    setPasswordOtpSent(false)
    setPasswordOtpVerified(false)
    setNewPassword("")
    setConfirmNewPassword("")
    setAccountMessage("Password updated.")
    window.setTimeout(() => setAccountMessage(""), 2000)
  }

  async function sendPasswordOtp() {
    setAccountError("")
    setAccountMessage("")
    if (!accountEmail.trim()) {
      setAccountError("Current login email is required.")
      return
    }
    setPasswordOtpBusy(true)
    const { error } = await signInWithOtp(accountEmail.trim(), { shouldCreateUser: false })
    setPasswordOtpBusy(false)
    if (error) {
      setAccountError(error)
      return
    }
    setPasswordOtpSent(true)
    setPasswordOtpVerified(false)
    setPasswordOtpCode("")
    setAccountMessage("OTP sent to your current email.")
  }

  async function verifyPasswordOtpNow() {
    setAccountError("")
    setAccountMessage("")
    if (passwordOtpCode.trim().length < 6) {
      setAccountError("Enter 6-digit OTP.")
      return
    }
    setPasswordOtpBusy(true)
    const { error } = await verifyEmailOtp(accountEmail.trim(), passwordOtpCode.trim(), "email")
    setPasswordOtpBusy(false)
    if (error) {
      setAccountError(error)
      return
    }
    setPasswordOtpVerified(true)
    setAccountMessage("OTP verified. You can now set a new password.")
  }

  if (!ready) {
    return (
      <div className="space-y-6">
        <div className="soft-card min-h-[140px] animate-pulse rounded-[24px] bg-slate-100 sm:rounded-[28px]" />
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="soft-card min-h-[260px] animate-pulse rounded-[24px] bg-slate-100 sm:rounded-[28px]" />
          <div className="soft-card min-h-[260px] animate-pulse rounded-[24px] bg-slate-100 sm:rounded-[28px]" />
        </div>
      </div>
    )
  }

  async function handleImportBackup(file: File) {
    setBackupBusy("import")
    setAccountError("")
    setAccountMessage("")
    try {
      const result = await importAppBackupJson(file)
      await Promise.allSettled([
        flushCloudKeyNow("businessProfile"),
        flushCloudKeyNow("invoices"),
        flushCloudKeyNow("products"),
        flushCloudKeyNow("customers"),
        flushCloudKeyNow("dateFormat"),
        flushCloudKeyNow("amountFormat"),
        flushCloudKeyNow("showDecimals"),
        flushCloudKeyNow("invoicePrefix"),
        flushCloudKeyNow("invoicePadding"),
        flushCloudKeyNow("invoiceStartNumber"),
        flushCloudKeyNow("resetYearly"),
        flushCloudKeyNow("invoiceResetMonthDay"),
        flushCloudKeyNow("currencySymbol"),
        flushCloudKeyNow("currencyPosition"),
        flushCloudKeyNow("invoiceVisibility"),
        flushCloudKeyNow("invoiceTemplate"),
      ])
      showAlert({
        tone: "success",
        title: "Backup imported",
        actionHint: "Your workspace has been refreshed with the imported data.",
        message: `${result.invoiceCount} invoices were restored from this backup.`,
      })
      router.refresh()
    } catch (error) {
      showAlert({
        tone: "danger",
        title: "Import failed",
        actionHint: "Check the backup file, then try again.",
        message: error instanceof Error ? error.message : "Could not import this backup.",
      })
    } finally {
      setBackupBusy(null)
      if (importInputRef.current) {
        importInputRef.current.value = ""
      }
    }
  }

  return (
    <div className="space-y-6 pb-24 lg:space-y-8 lg:pb-0">
      {setupMode && (
        <section className="rounded-[24px] border border-emerald-200 bg-emerald-50/80 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">Setup Step 2</p>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Your business profile is saved. Now finish setup by choosing how invoice dates, decimals, currency, and invoice
            numbers should behave. When you save here, your workspace is ready.
          </p>
        </section>
      )}

      <section>
        <p className="text-xs uppercase tracking-[0.34em] text-emerald-700">Settings</p>
        <h1 className="font-display mt-3 text-3xl text-slate-950 sm:text-4xl">Fine-tune how easyBILL formats your invoices.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
          Control formatting, currency display, and numbering preferences - without changing your invoice workflow.
        </p>
      </section>

      <div className="soft-card rounded-[24px] p-4 sm:rounded-[28px] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="section-title text-2xl">Account</h2>
            <p className="mt-1 text-sm text-slate-500">Update your login email and password. Your account ID never changes.</p>
          </div>

          <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700">
            ID: <span className="font-mono">{accountUserId || "-"}</span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-[1.35fr_0.65fr] md:items-start">
          <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Login</p>
            <p className="mt-2 text-sm text-slate-700">
              Current login email: <span className="font-semibold text-slate-950">{accountEmail || "-"}</span>
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              This is used only for signing in, not invoice emails.
            </p>
          </div>

          <div className="grid gap-3">
            <button
              type="button"
              disabled={emailPolicyLoading || !emailPolicy?.canChange}
              onClick={() => {
                if (emailPolicyLoading || !emailPolicy?.canChange) return
                setAccountError("")
                setAccountMessage("")
                setShowEmailEditor((prev) => {
                  const next = !prev
                  if (next) {
                    setEmailChangeStep("password")
                    setEmailOtpCode("")
                  } else {
                    setEmailChangeStep("password")
                    setEmailOtpCode("")
                    setCurrentPassword("")
                  }
                  return next
                })
                setShowPasswordEditor(false)
              }}
              className={`rounded-[24px] border px-5 py-4 text-left text-sm font-semibold transition ${
                showEmailEditor
                  ? "border-slate-300 bg-white shadow-[0_18px_44px_rgba(15,23,42,0.06)]"
                  : emailPolicyLoading || !emailPolicy?.canChange
                    ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <p className="text-slate-950">Change email</p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {emailPolicyLoading
                  ? "Checking 90-day policy..."
                  : emailPolicy?.canChange
                    ? showEmailEditor
                      ? "Hide options"
                      : "Show options"
                    : `Locked for ${emailPolicy?.remainingDays ?? 0} more day(s)`}
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setAccountError("")
                setAccountMessage("")
                setShowPasswordEditor((prev) => {
                  const next = !prev
                  if (!next) {
                    setPasswordOtpSent(false)
                    setPasswordOtpVerified(false)
                    setPasswordOtpCode("")
                    setNewPassword("")
                    setConfirmNewPassword("")
                  }
                  return next
                })
                setShowEmailEditor(false)
              }}
              className={`rounded-[24px] border px-5 py-4 text-left text-sm font-semibold transition ${
                showPasswordEditor
                  ? "border-slate-300 bg-white shadow-[0_18px_44px_rgba(15,23,42,0.06)]"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <p className="text-slate-950">Change password</p>
              <p className="mt-1 text-xs font-medium text-slate-500">{showPasswordEditor ? "Hide options" : "Show options"}</p>
            </button>
          </div>
        </div>

        {showEmailEditor ? (
          <>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-medium text-slate-900">Current password</p>
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className={selectStyle}
                  disabled={emailChangeStep === "otp"}
                />
                <label className="mt-2 inline-flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={showCurrentPassword}
                    onChange={(e) => setShowCurrentPassword(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                    disabled={emailChangeStep === "otp"}
                  />
                  Show password
                </label>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-900">New login email</p>
                <input
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="you@business.com"
                  className={selectStyle}
                  disabled={emailChangeStep === "otp"}
                />
              </div>
            </div>

            {emailChangeStep === "otp" ? (
              <div className="mt-5 grid gap-3">
                <p className="text-sm text-slate-600">Enter OTP sent to your new email.</p>
                <input
                  value={emailOtpCode}
                  onChange={(e) => setEmailOtpCode(e.target.value)}
                  inputMode="numeric"
                  placeholder="Enter 6-digit OTP"
                  className={selectStyle}
                />
              </div>
            ) : null}

            {accountError ? <p className="mt-4 text-sm text-rose-600">{accountError}</p> : null}
            {accountMessage ? <p className="mt-4 text-sm text-emerald-700">{accountMessage}</p> : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                {emailChangeStep === "password"
                  ? "Enter current password and continue to OTP verification."
                  : "Verify OTP to finish changing your login email."}
              </p>
              <button
                onClick={updateEmailOnly}
                disabled={emailChangeBusy}
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {emailChangeBusy
                  ? "Processing..."
                  : emailChangeStep === "password"
                    ? "Continue"
                    : "Verify with OTP"}
              </button>
            </div>
          </>
        ) : null}

        {showPasswordEditor ? (
          <>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-medium text-slate-900">Change with OTP</p>
                <button
                  type="button"
                  onClick={sendPasswordOtp}
                  disabled={passwordOtpBusy || !accountEmail.trim()}
                  className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                    passwordOtpBusy || !accountEmail.trim()
                      ? "cursor-not-allowed bg-slate-200 text-slate-500"
                      : "bg-slate-950 text-white hover:bg-slate-800"
                  }`}
                >
                  {passwordOtpBusy ? "Sending OTP..." : "Send OTP to current email"}
                </button>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  OTP will be sent to <span className="font-semibold text-slate-700">{accountEmail || "your current login email"}</span>.
                </p>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-900">Enter 6-digit OTP</p>
                <input
                  value={passwordOtpCode}
                  onChange={(e) => setPasswordOtpCode(e.target.value)}
                  placeholder="000000"
                  className={selectStyle}
                  disabled={!passwordOtpSent || passwordOtpVerified}
                />
                <button
                  type="button"
                  onClick={verifyPasswordOtpNow}
                  disabled={!passwordOtpSent || passwordOtpVerified || passwordOtpBusy || passwordOtpCode.trim().length < 6}
                  className={`mt-3 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                    !passwordOtpSent || passwordOtpVerified || passwordOtpBusy || passwordOtpCode.trim().length < 6
                      ? "cursor-not-allowed bg-slate-200 text-slate-500"
                      : "bg-slate-950 text-white hover:bg-slate-800"
                  }`}
                >
                  {passwordOtpVerified ? "OTP Verified" : passwordOtpBusy ? "Verifying..." : "Verify OTP"}
                </button>
              </div>

              <div className="md:col-span-2">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-900">New password</p>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password"
                      className={selectStyle}
                      disabled={!passwordOtpVerified}
                    />
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Use 7–20 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character.
                    </p>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-900">Confirm new password</p>
                    <input
                      type={showConfirmNewPassword ? "text" : "password"}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className={selectStyle}
                      disabled={!passwordOtpVerified}
                    />
                  </div>
                </div>
                <label className="mt-2 inline-flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={showNewPassword && showConfirmNewPassword}
                    onChange={(e) => {
                      setShowNewPassword(e.target.checked)
                      setShowConfirmNewPassword(e.target.checked)
                    }}
                    className="h-4 w-4 rounded border-slate-300"
                    disabled={!passwordOtpVerified}
                  />
                  Show password
                </label>
              </div>
            </div>

            {accountError ? <p className="mt-4 text-sm text-rose-600">{accountError}</p> : null}
            {accountMessage ? <p className="mt-4 text-sm text-emerald-700">{accountMessage}</p> : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Verify OTP first, then set and confirm your new password.
              </p>
              <button
                onClick={updatePasswordOnly}
                disabled={!passwordOtpVerified || updatePasswordBusy}
                className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                  passwordOtpVerified && !updatePasswordBusy
                    ? "bg-slate-950 text-white hover:bg-slate-800"
                    : "cursor-not-allowed bg-slate-200 text-slate-500"
                }`}
              >
                {updatePasswordBusy ? "Updating..." : "Update Password"}
              </button>
            </div>
          </>
        ) : null}
      </div>

      <div className="soft-card rounded-[24px] p-4 sm:rounded-[28px] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="section-title text-2xl">Invoice visibility</h2>
            <p className="mt-1 text-sm text-slate-500">
              Choose what business/client details should appear on invoices across templates, view, print, and PDF.
            </p>
          </div>
          <button
            type="button"
            onClick={() => requestGuardedNavigation(() => router.push("/dashboard/settings/invoice-visibility"))}
            className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
          >
            Manage invoice visibility
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="soft-card rounded-[24px] p-4 sm:rounded-[28px] sm:p-6">
          <h2 className="section-title text-2xl">Formatting</h2>
          <p className="mt-1 text-sm text-slate-500">How date and amount information appears across the app.</p>

          <div className="mt-6 space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium text-slate-900">Date Format</p>
              <SelectMenu
                value={draftDateFormat}
                onChange={setDraftDateFormat}
                options={[
                  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
                  { value: "DD-MM-YYYY", label: "DD-MM-YYYY" },
                  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
                  { value: "MM-DD-YYYY", label: "MM-DD-YYYY" },
                ]}
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-slate-900">Amount Format</p>
              <SelectMenu
                value={draftAmountFormat}
                onChange={setDraftAmountFormat}
                options={[
                  { value: "indian", label: "Indian (1,23,456)" },
                  { value: "international", label: "International (123,456)" },
                ]}
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-slate-900">Decimal Setting</p>
              <SelectMenu
                value={draftShowDecimals ? "yes" : "no"}
                onChange={(v) => setDraftShowDecimals(v === "yes")}
                options={[
                  { value: "yes", label: "Show Decimals (1,250.00)" },
                  { value: "no", label: "Round Off (1,250)" },
                ]}
              />
            </div>
          </div>
        </div>

        <div className="soft-card rounded-[24px] p-4 sm:rounded-[28px] sm:p-6">
          <h2 className="section-title text-2xl">Currency</h2>
          <p className="mt-1 text-sm text-slate-500">Choose how currency appears on every invoice.</p>

          <div className="mt-6 space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium text-slate-900">Currency Symbol</p>
              <SelectMenu
                value={draftCurrencySymbol}
                onChange={setDraftCurrencySymbol}
                options={[
                  { value: "₹", label: "₹ Indian Rupee" },
                  { value: "$", label: "$ US Dollar" },
                  { value: "EUR", label: "EUR Euro" },
                  { value: "GBP", label: "GBP Pound" },
                ]}
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-slate-900">Currency Position</p>
              <SelectMenu
                value={draftCurrencyPosition}
                onChange={(v) => setDraftCurrencyPosition(v as "before" | "after")}
                options={[
                  { value: "before", label: "₹ 1,250" },
                  { value: "after", label: "1,250 ₹" },
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="soft-card rounded-[24px] p-4 sm:rounded-[28px] sm:p-6">
        <h2 className="section-title text-2xl">Invoice Numbering</h2>
        <p className="mt-1 text-sm text-slate-500">Define the structure of invoice numbers generated in your workspace.</p>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-900">Invoice Prefix</p>
            <input
              value={draftInvoicePrefix}
              onChange={(e) => {
                setDraftInvoicePrefix(e.target.value)
                setPrefixErrorMessage("")
              }}
              className={`${selectStyle} ${invoicePrefixError ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100" : ""}`}
            />
            {invoicePrefixError ? (
              <p className="mt-2 text-xs leading-5 text-rose-600">
                {prefixErrorMessage || invoicePrefixError}
              </p>
            ) : (
              <p className="mt-2 text-xs leading-5 text-slate-500">Examples: INV-, DOC_, BILL(2026)-</p>
            )}
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-900">Number Format</p>
            <SelectMenu
              value={String(draftInvoicePadding)}
              onChange={(v) => setDraftInvoicePadding(Number(v))}
              options={[
                { value: "2", label: "01 (2 digits)" },
                { value: "3", label: "001 (3 digits)" },
                { value: "4", label: "0001 (4 digits)" },
                { value: "5", label: "00001 (5 digits)" },
              ]}
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-900">Starting Number</p>
            <input
              type="number"
              min={1}
              value={draftInvoiceStartNumber}
              onChange={(e) => setDraftInvoiceStartNumber(Number(e.target.value))}
              className={selectStyle}
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-900">Yearly Reset</p>
            <SelectMenu
              value={draftResetYearly ? "yes" : "no"}
              onChange={(v) => setDraftResetYearly(v === "yes")}
              options={[
                { value: "yes", label: "Reset Every Financial Year" },
                { value: "no", label: "Continuous Numbering" },
              ]}
            />
          </div>

          {draftResetYearly ? (
            <div className="md:col-span-2">
              <p className="mb-2 text-sm font-medium text-slate-900">Reset Date</p>
              <SelectMenu
                value={draftInvoiceResetMonthDay}
                onChange={setDraftInvoiceResetMonthDay}
                options={RESET_MONTH_DAY_OPTIONS}
              />
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Reset is based on invoice date. Invoices dated on or after the 1st of {formatResetMonthLabel(draftInvoiceResetMonthDay)} start again from your starting number, while earlier invoices remain in the previous cycle.
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Preview</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{invoicePreview}</p>
          <p className="mt-2 text-sm text-slate-500">
            This is how the next generated invoice number will look with your current selections.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {invoicePreviewSeries.map((value) => (
              <span
                key={value}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
              >
                {value}
              </span>
            ))}
          </div>
          {numberingScopeNotice ? (
            <p className="mt-3 text-sm leading-6 text-indigo-700">{numberingScopeNotice}</p>
          ) : null}
          {duplicateCycleWarning ? (
            <p className="mt-3 text-sm leading-6 text-amber-700">{duplicateCycleWarning}</p>
          ) : null}
        </div>
      </div>

      <div className="soft-card rounded-[24px] p-4 sm:rounded-[28px] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="section-title text-2xl">Backup and restore</h2>
            <p className="mt-1 text-sm text-slate-500">
              Export your workspace as JSON, or restore invoices, products, customers, business profile, and settings from a backup file.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setBackupBusy("export")
              downloadAppBackupJson()
              window.setTimeout(() => setBackupBusy(null), 500)
            }}
            className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 text-left transition hover:bg-slate-50"
          >
            <p className="text-sm font-semibold text-slate-900">{backupBusy === "export" ? "Preparing export..." : "Export JSON backup"}</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">Download a full backup of invoices, products, customers, business profile, and workspace settings.</p>
          </button>

          <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4">
            <p className="text-sm font-semibold text-slate-900">{backupBusy === "import" ? "Importing backup..." : "Import JSON backup"}</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">Restore a previously exported easyBILL backup file into this workspace.</p>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json"
              className="mt-4 block w-full text-sm text-slate-500"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                void handleImportBackup(file)
              }}
            />
          </div>
        </div>
      </div>

      <div className="soft-card rounded-[24px] p-4 sm:rounded-[28px] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="section-title text-2xl">Report bug and feedback</h2>
            <p className="mt-1 text-sm text-slate-500">
              Share issues and ideas with full context so improvements can be shipped faster.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Open the report page to submit complete bug or feedback details.
          </p>
          <button
            type="button"
            onClick={() => requestGuardedNavigation(() => router.push("/dashboard/settings/report"))}
            className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
          >
            Report bug and feedback
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">{hasPendingChanges ? "Unsaved changes" : "All changes saved"}</p>
          <p className="text-sm text-slate-500">
            {savingSettings
              ? "Saving your settings..."
              : hasPendingChanges
                ? "Your invoice settings will apply only after you save."
                : saveMessage || "No pending updates right now."}
          </p>
        </div>

        <button
          onClick={() => void saveChanges()}
          disabled={!hasPendingChanges || savingSettings}
          className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
            hasPendingChanges && !savingSettings
              ? "bg-slate-950 text-white hover:bg-slate-800"
              : "bg-slate-200 text-slate-500"
          }`}
        >
          {savingSettings ? "Saving..." : setupMode ? "Finish Setup" : "Save Changes"}
        </button>
      </div>
    </div>
  )
}

